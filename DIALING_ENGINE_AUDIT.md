# Dialing Engine & Call Flow - Forensic Audit
# this is done prior to doing any changes, first thing

**Date:** Current State Analysis  
**Mode:** READ-ONLY  
**Status:** Documentation Only - No Code Changes

---

## 1. CURRENT_STATE Summary

### 1.1 Architecture Overview

The dialing system uses a **hybrid architecture**:
- **Backend (Node.js/Express)**: Creates Twilio calls via REST API, handles status callbacks, generates TwiML
- **Frontend (React)**: Manages Twilio Device (WebRTC), handles incoming call events, manages UI state
- **Communication**: Socket.IO for real-time status updates, Twilio WebRTC for audio

### 1.2 Active Call State Ownership

**Backend State:**
- `ActiveCalls` service (singleton, in-memory): Tracks `{callSid, phoneNumber, timestamp}` array
  - Location: `back_end/voice-call-manager-be/src/services/active-calls.ts`
  - Mutated by: `campaign.ts` (addCall), `twilio.ts` (removeCall), `campaign.ts` (resetCalls)
  - **CRITICAL**: In-memory only, lost on server restart

**Frontend State:**
- `useCampaign` hook: Manages campaign-specific state
  - `currentBatch`: Array of CallSession objects
  - `ringingSessions`: Array of sessions currently ringing
  - `answeredSession`: Single Contact/boolean for active call
  - `pendingResultContacts`: Array of contacts awaiting result entry
  - `activeCallRef`: Ref to Twilio Call object
  - `callToContactMap`: Map<Call, CallSession> for call-to-contact association
- `useInboundCall` hook: Manages inbound call state (separate from campaign)
- `useAdminPhone` hook: Manages Twilio Device lifecycle and incoming handler registration

**Database State:**
- `CallLog` model: Persistent call records
- `PhoneNumber` model: Tracks usage stats (attemptedCalls, rejectedCalls, lastUsed, usageCount)
- `Contact` model: Stores call results and notes

### 1.3 Twilio Device Lifecycle

**Initialization:**
- Location: `front_end/voice-call-manager-fe/src/utils/initTwilio.ts`
- Singleton pattern: `twilioDeviceInstance` (module-level variable)
- Initialized in: `useAdminPhone` hook when `userId` is available
- Token generation: POST `/api/twilio/token` → returns JWT token
- Device creation: `new Device(token, {logLevel: "error", codecPreferences: ["opus", "pcmu"]})`
- Registration: `device.register()` called after initialization

**Incoming Handler Registration:**
- Single handler slot: `setIncomingHandler` in `useAdminPhone`
- **CRITICAL**: Only ONE handler can be registered at a time
- Campaign hook (`useCampaign`) sets handler when enabled
- Inbound call hook (`useInboundCall`) sets handler separately
- **CONFLICT RISK**: Both hooks may compete for handler registration

**Destruction:**
- `destroyTwilioDevice()` called on `useAdminPhone` cleanup
- Device destroyed on user logout/component unmount

### 1.4 Call Initiation Paths

**Path 1: Campaign Batch Calls (ACTIVE)**
- Entry: `Campaign.tsx` → `makeCallBatch()`
- Backend: POST `/api/campaign/call-campaign`
- Creates multiple Twilio calls in parallel via `Promise.all()`
- Uses `getCooledDownNumbers()` for number selection
- Each call includes `contactId` in callback URL

**Path 2: Single "Not Known" Call (ACTIVE)**
- Entry: `Campaign.tsx` → `makeCallNotKnown(phone)`
- Backend: POST `/api/campaign/call-notknown`
- Creates single call without `contactId`
- Used for dialing arbitrary phone numbers

**Path 3: CIDR Interop Originate (ACTIVE but EXTERNAL)**
- Entry: POST `/api/cidr/originate` (external system, CIDR auth required)
- Backend: `cidr-interop.ts`
- Creates call but does NOT use `ActiveCalls` service
- Uses separate in-memory `activeCalls` Map
- **ISSUE**: Separate tracking from main campaign system

**Path 4: startSingleCall() (UNUSED)**
- Location: `front_end/voice-call-manager-fe/src/utils/startSingleCall.ts`
- Function: `device.connect()` with params
- **STATUS**: Defined but never imported or called
- **DEAD CODE**

### 1.5 TwiML Generation

**Outbound Calls (in-progress status):**
- Location: `back_end/voice-call-manager-be/src/routers/twilio.ts` line 139-146
- Trigger: When `CallStatus === "in-progress"` in status callback
- Generates: `<Dial><Client>webrtc_user</Client></Dial>`
- Parameters passed: `contactId`, `outbound="true"`, `callSid`
- **CRITICAL**: This TwiML connects the external call to the WebRTC user

**Inbound Calls:**
- Location: `back_end/voice-call-manager-be/src/routers/twilio.ts` line 280-292
- Trigger: POST `/api/twilio/inbound` (Twilio webhook)
- Generates: `<Dial><Client>webrtc_user</Client></Dial>`
- Parameters: `outbound="false"`
- Recording: Enabled with `record="record-from-answer"`

### 1.6 Status Callback Flow

**Backend Handler:**
- Location: `back_end/voice-call-manager-be/src/routers/twilio.ts` line 50-228
- Endpoint: POST `/api/twilio/status-callback`
- Query params: `userId`, `contactId` (optional)

**Status Events Handled:**
1. `initiated`: Creates CallLog entry, increments PhoneNumber.attemptedCalls
2. `ringing`: Emits socket event `call-status-user-${userId}`
3. `in-progress`: 
   - Updates CallLog with `connectedAt`, `answeredBy`
   - Generates TwiML to connect to WebRTC user
   - **CRITICAL**: Terminates all other calls in ActiveCalls (winner-take-all behavior)
   - Updates Contact status to "dropped" for other calls
4. `completed/canceled/failed/no-answer/busy`: 
   - Calculates duration
   - Updates CallLog with final status
   - Removes from ActiveCalls
   - Emits final socket event

**Socket Events Emitted:**
- Event name: `call-status-user-${userId}`
- Payload: `{to: phoneNumber, status: CallStatus, answeredBy?: string, reason?: string}`
- Room: `user-${userId}` (Socket.IO room)

### 1.7 Frontend Call Event Handling

**Campaign Hook (`useCampaign`):**
- Listens to: Socket event `call-status-user-${userId}`
- Handler: `handleCallStatus()`
- Updates: `ringingSessions`, `answeredSession`, `pendingResultContacts`
- **CRITICAL**: Filters by matching phone number to `currentBatch`

**Twilio Device Incoming:**
- Handler registered in `useCampaign` useEffect (line 166-208)
- Checks: `outbound === "true"` parameter
- If outbound: Accepts call, binds event handlers, updates state
- If inbound: Returns early (handled by `useInboundCall`)

**Call Event Handlers Bound:**
- `volume`: Passed to `callEventHandlers.volumeHandler`
- `disconnect`: Calls `handleHangUp()` to clean up state

### 1.8 Parallel Call Management

**Batch Sizes:**
- SOFT_CALL: 1 call at a time
- PARALLEL_CALL: 2 calls at a time
- ADVANCED_PARALLEL_CALL: 4 calls at a time

**Winner-Take-All Logic:**
- Location: `back_end/voice-call-manager-be/src/routers/twilio.ts` line 154-180
- When one call reaches `in-progress`:
  - All other calls in `ActiveCalls` are terminated
  - Contact status set to "dropped" for terminated calls
  - Only the first answered call proceeds to WebRTC connection

---

## 2. Step-by-Step Call Flow

### 2.1 Campaign Batch Call Flow

**Step 1: User Initiates Campaign**
- User clicks "Start campaign" in `Campaign.tsx`
- `handleStartCampaign()` called
- `setIsCampaignRunning(true)`
- `makeCallBatch()` called

**Step 2: Frontend Prepares Batch**
- Slices contacts array based on `callsPerBatch` (1, 2, or 4)
- POST `/api/contacts/batch` to fetch full contact data
- POST `/api/campaign/call-campaign` with contacts array

**Step 3: Backend Creates Twilio Calls**
- `campaign.ts` → `call-campaign` handler
- Gets cooled-down phone numbers via `getCooledDownNumbers()`
- For each contact, creates Twilio call:
  ```typescript
  client.calls.create({
    url: `${config.rootUrl}/api/twilio/status-callback?userId=${userId}&contactId=${contact.id}`,
    to: normalizePhone(contact.phone),
    from: fromNumber,
    statusCallback: ...,
    statusCallbackEvent: ["initiated", "ringing", "in-progress", "completed", ...],
    machineDetection: "Enable",
    record: true,
  })
  ```
- Adds to `ActiveCalls.addCall(call.sid, contact.phone)`
- Updates PhoneNumber usage stats
- Returns active calls array to frontend

**Step 4: Frontend Updates State**
- Receives active calls array
- Maps callSid to contacts: `{...contact, callSid}`
- Sets `currentBatch` state
- Sets `currentBatchRef.current`

**Step 5: Twilio Status Callbacks (Backend)**
- **initiated**: Creates CallLog entry, increments stats, emits socket event
- **ringing**: Emits socket event `call-status-user-${userId}` with status "ringing"
- **in-progress**: 
  - Updates CallLog with connectedAt, answeredBy
  - Generates TwiML: `<Dial><Client>webrtc_user</Client></Dial>` with params
  - Terminates all other calls in ActiveCalls
  - Returns TwiML to Twilio

**Step 6: Frontend Receives Socket Events**
- `useCampaign` hook listens to `call-status-user-${userId}`
- **ringing**: Adds contact to `ringingSessions` array
- **in-progress**: 
  - Removes from `ringingSessions`
  - Sets `answeredSession` to contact
  - Sets `lastAnsweredId`

**Step 7: Twilio Connects to WebRTC**
- Twilio executes TwiML, dials `webrtc_user` client
- Twilio Device receives "incoming" event
- `useCampaign` handler checks `outbound === "true"`
- Finds contact in `currentBatchRef.current` by `contactId`
- Updates `currentBatch` with `callSid`
- Binds call event handlers (volume, disconnect)
- Calls `call.accept()`
- Sets status: "Outbound call accepted"

**Step 8: Call Active**
- User can interact with call (DTMF via numpad)
- Volume events fire → `volumeHandler` updates UI
- Call state managed in `activeCallRef.current`

**Step 9: Call Termination**
- User clicks hang up OR call disconnects
- `handleHangUp()` called
- Adds contact to `pendingResultContacts` (if in campaign)
- Cleans up `callToContactMap`
- Sets `answeredSession = null`
- Shows continue dialog (if campaign)

**Step 10: Backend Final Status**
- Twilio sends `completed` status callback
- Backend calculates duration
- Updates CallLog with final status, duration, needsFollowUp
- Removes from `ActiveCalls`
- Emits final socket event

**Step 11: Frontend Final State**
- Receives `completed` status via socket
- If contact matches `answeredSession`, ignores (WebRTC still active)
- Otherwise, adds to `pendingResultContacts`
- When all contacts handled + no ringing + no answered → shows continue dialog

### 2.2 Single "Not Known" Call Flow

**Step 1: User Dials Number**
- User enters phone in dial pad (AdminLayout)
- `onCall(phone)` called
- Navigates to `/campaign` with `{phone, contactId: null, autoStart: false}`

**Step 2: User Starts Call**
- `makeCallNotKnown(phone)` called
- POST `/api/campaign/call-notknown` with `{phone}`
- Backend creates call (no contactId in callback URL)
- Adds to `ActiveCalls`

**Step 3-9: Same as Campaign Flow**
- Status callbacks flow identically
- Socket events received
- WebRTC connection established
- **DIFFERENCE**: No contactId, so `answeredSession` set to `true` (boolean) instead of Contact object

**Step 10: Hang Up**
- `handleHangUpNotKnown()` called
- Simply clears `answeredSession` and `activeCallRef`
- No result dialog (no contact to save result to)

### 2.3 Inbound Call Flow

**Step 1: Twilio Receives Inbound Call**
- POST `/api/twilio/inbound` webhook
- Backend finds PhoneNumber record
- Creates CallLog entry (direction: "inbound")
- Emits socket event: `inbound-call` to `user-${userId}`

**Step 2: Frontend Receives Inbound Notification**
- `useInboundCall` hook (separate from campaign)
- Sets `inboundCall` state
- Opens `InboundCallDialog`

**Step 3: User Accepts/Rejects**
- Accept: `call.accept()`
- Reject: `call.reject()`

**Step 4: TwiML Generation**
- Backend returns TwiML: `<Dial><Client>webrtc_user</Client></Dial>`
- Parameter: `outbound="false"`

**Step 5: WebRTC Connection**
- Twilio Device receives "incoming" event
- `useInboundCall` handler checks `outbound !== "true"` → processes
- `useCampaign` handler checks `outbound === "true"` → returns early
- Call accepted, connected

---

## 3. Dead / Unused Dialing Code

### 3.1 Unused Functions

**`startSingleCall()`**
- Location: `front_end/voice-call-manager-fe/src/utils/startSingleCall.ts`
- Status: **DEAD CODE**
- Evidence: No imports found in codebase
- Purpose: Would initiate call via `device.connect()` with contactId
- **Note**: This appears to be an alternative call initiation method that was never integrated

### 3.2 Unused/Incomplete Code Paths

**CIDR Interop ActiveCalls Tracking**
- Location: `back_end/voice-call-manager-be/src/routers/cidr-interop.ts` line 18-21
- Status: **SEPARATE TRACKING** (not dead, but isolated)
- Issue: Uses local `activeCalls` Map instead of `ActiveCalls` service
- Impact: CIDR-originated calls not visible to main campaign system
- **Note**: This may be intentional for external system isolation

**`/api/twilio/inbound` Endpoint**
- Location: `back_end/voice-call-manager-be/src/routers/twilio.ts` line 232-293
- Status: **ACTIVE** but has TODO comment
- Comment: "TO DO -- this controller will be used if 'in-progress' status can be separated here"
- **Note**: Currently used for inbound calls, but comment suggests potential refactoring

**Campaign Router Missing Response**
- Location: `back_end/voice-call-manager-be/src/routers/campaign.ts` line 48
- Status: **INCOMPLETE**
- Issue: `res.status(200);` without `.end()` or `.json()`
- Impact: Response may hang or fail
- **Note**: Likely bug, not dead code

### 3.3 Unused Socket Events

**`join-room` Event**
- Location: `back_end/voice-call-manager-be/src/index.ts` line 140-148
- Status: **DEFINED but UNUSED**
- Evidence: No frontend code calls `socket.emit("join-room")`
- Purpose: Would join custom room for call status
- **Note**: Appears to be legacy or planned feature

**`call-status-${roomId}` Event**
- Location: `back_end/voice-call-manager-be/src/index.ts` line 144
- Status: **EMITTED but UNLISTENED**
- Evidence: Frontend only listens to `call-status-user-${userId}`
- **Note**: Part of unused `join-room` feature

### 3.4 Incomplete Error Handling

**Campaign Router Error Handling**
- Location: `back_end/voice-call-manager-be/src/routers/campaign.ts` line 51
- Comment: "// TO-DO error handling"
- Status: **MISSING** try-catch blocks in `call-campaign` endpoint

**Frontend Campaign Error Handling**
- Location: `front_end/voice-call-manager-fe/src/pages/admin/Campaign/Campaign.tsx` line 153
- Comment: "// TO-DO implement try-catch"
- Status: **PARTIAL** - has catch block but may not cover all cases

### 3.5 Unused State/Refs

**`answeredSessionRef` in useCampaign**
- Location: `front_end/voice-call-manager-fe/src/pages/admin/Campaign/useCampaign.ts` line 45, 210-212
- Status: **USED** but purpose unclear
- Usage: Only checked in `handleCallStatus` to determine if call is "winner"
- **Note**: Could potentially use `answeredSession` state directly

**`twilioDeviceRef` in useAdminPhone**
- Location: `front_end/voice-call-manager-fe/src/hooks/useAdminPhone.tsx` line 22
- Status: **DEFINED but UNUSED**
- Evidence: Only `twilioDevice` state is used, ref is never accessed
- **Note**: Likely leftover from refactoring

---

## 4. Critical Findings

### 4.1 State Ownership Issues

1. **ActiveCalls Service**: In-memory only, lost on restart
2. **Handler Registration Conflict**: `useCampaign` and `useInboundCall` both set `incomingHandler` - last one wins
3. **Separate CIDR Tracking**: CIDR calls use different tracking system

### 4.2 Race Conditions

1. **Parallel Call Acceptance**: Multiple calls may reach `in-progress` simultaneously before winner-take-all logic executes
2. **Handler Replacement**: If user navigates between campaign and other pages, incoming handler may be replaced mid-call

### 4.3 Missing Error Handling

1. **Campaign Router**: No try-catch in `call-campaign` endpoint
2. **Frontend**: Incomplete error handling in `makeCallBatch`

### 4.4 Incomplete Implementations

1. **Campaign Response**: Missing `.end()` or `.json()` in `call-notknown` endpoint
2. **Socket Room Feature**: `join-room` defined but never used

---

## 5. UNKNOWN / Uncertain

1. **Twilio Device Registration**: Exact timing of when device becomes ready to receive calls after `register()` - UNKNOWN
2. **Number Cooling Logic**: Details of `getCooledDownNumbers()` implementation - NOT REVIEWED
3. **Call Time Threshold**: How `getCallTimeThreshold()` determines success threshold - NOT REVIEWED
4. **Socket Reconnection**: Behavior when socket disconnects during active call - NOT REVIEWED
5. **Machine Detection**: How `machineDetection: "Enable"` results are used beyond logging - PARTIALLY REVIEWED (only logged, not acted upon)
6. **Recording Callback**: Full flow of recording callbacks - NOT FULLY TRACED

---

**END OF AUDIT**
