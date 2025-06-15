import React from "react";

const InboundCallDialog: React.FC = () => {
  return (
    <div className="incoming-call-dialog">
      <div className="dialog-content">
        <h3>Incoming Call</h3>
        <p>
          {outbound ? "(Campaign Call)" : "From"}: <strong>{from}</strong>
        </p>
        <button onClick={acceptCall} className="accept-btn">
          Accept
        </button>
        <button onClick={rejectCall} className="reject-btn">
          Decline
        </button>
      </div>
    </div>
  );
};

export default InboundCallDialog;
