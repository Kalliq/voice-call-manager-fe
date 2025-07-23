// src/contexts/GoogleCalendarContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}

interface GoogleCalendarContextType {
  isLoading: boolean;
  events: CalendarEvent[];
  signIn: () => void;
  signOut: () => void;
}

const GoogleCalendarContext = createContext<GoogleCalendarContextType | undefined>(undefined);

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID!;
const API_KEY   = import.meta.env.VITE_GOOGLE_API_KEY!;
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

export const GoogleCalendarProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const tokenClient = useRef<any>(null);

  useEffect(() => {
    window.gapi.load('client', async () => {
      await window.gapi.client.init({ apiKey: API_KEY, discoveryDocs: DISCOVERY_DOCS });
      tokenClient.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp: any) => {
          if (resp.error) {
            console.error('Token error', resp);
            return;
          }
          window.gapi.client.setToken({ access_token: resp.access_token });
          fetchEvents();
        },
      });
      setIsLoading(false);
    });
  }, []);

  const fetchEvents = async () => {
    const now = new Date();
    const res = await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString(),
      timeMax: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    const items = res.result.items || [];
    setEvents(
      items.map((e: any) => ({
        id: e.id,
        title: e.summary || 'No title',
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
      }))
    );
  };

  const signIn = () => {
    if (!tokenClient.current) {
      console.error('Token client not initialized yet');
      return;
    }
    tokenClient.current.requestAccessToken({ prompt: 'consent' });
  };
  const signOut = () => {
    window.gapi.client.setToken({ access_token: '' });
    setEvents([]);
  };

  return (
    <GoogleCalendarContext.Provider value={{ isLoading, events, signIn, signOut }}>
      {children}
    </GoogleCalendarContext.Provider>
  );
};

export const useGoogleCalendar = () => {
  const ctx = useContext(GoogleCalendarContext);
  if (!ctx) throw new Error('Must be used inside GoogleCalendarProvider');
  return ctx;
};


// import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import 'gapi-script';

// const gapi = (window as any).gapi;

// interface GoogleCalendarContextType {
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   events: any[];
//   signIn: () => Promise<void>;
//   signOut: () => Promise<void>;
//   fetchEvents: () => Promise<void>;
//   createEvent: (event: any) => Promise<void>;
// }

// const GoogleCalendarContext = createContext<GoogleCalendarContextType | undefined>(undefined);

// interface GoogleCalendarProviderProps {
//   children: ReactNode;
// }

// const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
// const CALENDAR_ID = 'primary';

// export const GoogleCalendarProvider: React.FC<GoogleCalendarProviderProps> = ({ children }) => {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [events, setEvents] = useState<any[]>([]);
//     console.log("CLIENT ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
//     console.log("API KEY:", import.meta.env.VITE_GOOGLE_API_KEY);

//   useEffect(() => {
//     const initialize = async () => {
//       if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
//         console.warn('Google Calendar credentials missing');
//         setIsLoading(false);
//         return;
//       }

//       gapi.load('client:auth2', async () => {
//         gapi.client.init({
//             apiKey: GOOGLE_API_KEY,
//             clientId: GOOGLE_CLIENT_ID,
//             discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
//             scope: "https://www.googleapis.com/auth/calendar.events",
//             prompt: "consent",
//             access_type: "offline"
//         });


//         const auth = gapi.auth2.getAuthInstance();
//         if (auth.isSignedIn.get()) {
//           setIsAuthenticated(true);
//           await fetchEvents();
//         }
//         setIsLoading(false);
//       });
//     };

//     initialize();
//   }, []);

//   const signIn = async () => {
//     const auth = gapi.auth2.getAuthInstance();
//     await auth.signIn();
//     setIsAuthenticated(true);
//     await fetchEvents();
//   };

//   const signOut = async () => {
//     const auth = gapi.auth2.getAuthInstance();
//     await auth.signOut();
//     setIsAuthenticated(false);
//     setEvents([]);
//   };

//   const fetchEvents = async () => {
//     const now = new Date();
//     const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
//     const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

//     const res = await gapi.client.calendar.events.list({
//       calendarId: CALENDAR_ID,
//       timeMin: oneMonthAgo.toISOString(),
//       timeMax: oneMonthFromNow.toISOString(),
//       singleEvents: true,
//       orderBy: 'startTime',
//     });

//     const data = res.result.items?.map((event: any) => ({
//       id: event.id,
//       title: event.summary,
//       start: event.start?.dateTime || event.start?.date,
//       end: event.end?.dateTime || event.end?.date,
//     })) || [];

//     setEvents(data);
//   };

//   const createEvent = async (eventData: any) => {
//     const newEvent = {
//       summary: eventData.title,
//       description: eventData.description,
//       location: eventData.location,
//       start: {
//         dateTime: eventData.start,
//         timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//       },
//       end: {
//         dateTime: eventData.end,
//         timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//       },
//     };

//     await gapi.client.calendar.events.insert({
//       calendarId: CALENDAR_ID,
//       resource: newEvent,
//     });

//     await fetchEvents();
//   };

//   return (
//     <GoogleCalendarContext.Provider value={{ isAuthenticated, isLoading, events, signIn, signOut, fetchEvents, createEvent }}>
//       {children}
//     </GoogleCalendarContext.Provider>
//   );
// };

// export const useGoogleCalendar = (): GoogleCalendarContextType => {
//   const context = useContext(GoogleCalendarContext);
//   if (!context) {
//     throw new Error('useGoogleCalendar must be used within a GoogleCalendarProvider');
//   }
//   return context;
// };
