import "./App.css";
import React, { useState, useRef, useEffect } from "react";

import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import "firebase/compat/analytics";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

firebase.initializeApp({
  // My config (REPLACE)
});

const auth = firebase.auth();
const firestore = firebase.firestore();
const roomsRef = firestore.collection("rooms");

function App() {
  const [user] = useAuthState(auth);

  return <div className="App">{user ? <HomePage /> : <SignIn />}</div>;
}

function HomePage() {
  const [currentRoom, setCurrentRoom] = useState("Sports"); // fix this
  const [showSidebarOnSmallScreen, setShowSidebarOnSmallScreen] =
    useState(false);

  const handleHamburgerClick = () => {
    setShowSidebarOnSmallScreen(true);
  };

  const handleSidebarClose = () => {
    setShowSidebarOnSmallScreen(false);
  };

  return (
    <div className="homepage">
      <SideBar
        setRoomIdentifier={setCurrentRoom}
        showOnSmallScreen={showSidebarOnSmallScreen}
        setShowOnSmallScreen={setShowSidebarOnSmallScreen}
      />
      {showSidebarOnSmallScreen && (
        <div className="sidebar-overlay" onClick={handleSidebarClose}></div>
      )}

      <div className="main-area">
        <div className="main-area-header">
          <SignOut />
          <div className="main-area-header-aligned">
            <button className="hamburger-menu" onClick={handleHamburgerClick}>
              <img src="hamburger-menu.png"></img>
            </button>
            <h1 className="current-room-indicator">{currentRoom}</h1>
          </div>
          <hr></hr>
        </div>
        <Room identifier={currentRoom} />
      </div>
    </div>
  );
}

function SideBar({
  setRoomIdentifier,
  showOnSmallScreen,
  setShowOnSmallScreen,
}) {
  const query = roomsRef.orderBy("createdAt");
  const [rooms] = useCollectionData(query, { idField: "id" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [doesRoomExist, setDoesRoomExist] = useState(false);

  const openCreateRoomModal = () => {
    setIsModalOpen(true);
  };

  const handleNewRoomCancel = () => {
    setIsModalOpen(false);
    setNewRoomName("");
    setDoesRoomExist(false);
  };

  const handleNewRoomSubmit = async (e) => {
    e.preventDefault();
    // Check if already exists
    const doc = await roomsRef.doc(newRoomName.trim()).get();
    if (doc.exists) {
      setDoesRoomExist(true);
    } else {
      await roomsRef.doc(newRoomName).set({
        name: newRoomName.trim(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      setIsModalOpen(false);
      setDoesRoomExist(false);
      setNewRoomName("");
    }
  };

  return (
    <div className="sidebar" id={!showOnSmallScreen ? "hidden" : ""}>
      <div className="rooms">
        <button className="create-room" onClick={openCreateRoomModal}>
          <img src="plus.png"></img>
          <p>New room</p>
        </button>
        {rooms &&
          rooms.map((room) => (
            <button
              className="room-button"
              onClick={() => {
                setRoomIdentifier(room.name);
                setShowOnSmallScreen(false);
              }}
              key={room.name}
            >
              {room.name}
            </button>
          ))}
      </div>

      {isModalOpen && (
        <div className="create-room-modal-container">
          <div className="modal-overlay" onClick={handleNewRoomCancel}></div>
          <form className="create-room-modal" onSubmit={handleNewRoomSubmit}>
            <div className="room-name">
              <label>Room Name: </label>
              <input
                type="text"
                value={newRoomName}
                onChange={(event) => setNewRoomName(event.target.value)}
              />
            </div>
            <div>
              <button type="submit">Create</button>
            </div>
            <div></div>
            {doesRoomExist && (
              <p className="room-exist-error">That room already exists</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

function Room({ identifier }) {
  const bottomPos = useRef();
  const messagesRef = firestore
    .collection("rooms")
    .doc(identifier)
    .collection("messages");
  const query = messagesRef.orderBy("createdAt");
  const [messages] = useCollectionData(query, { idField: "id" });

  const [formValue, setFormValue] = useState("");

  const sendMessage = async (e) => {
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;
    const displayName = auth.currentUser.displayName;

    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
      displayName,
    });

    setFormValue("");
    bottomPos.current.scrollIntoView({ behavior: "smooth" });
  };

  const showMessage = (msg, index, arr) => {
    if (index != 0 && arr[index - 1].uid == msg.uid) {
      return (
        <Message
          key={msg.id}
          message={msg}
          author={msg.displayName}
          isSameAuthorAsAbove={true}
        />
      );
    } else {
      return (
        <Message
          key={msg.id}
          message={msg}
          author={msg.displayName}
          isSameAuthorAsAbove={false}
        />
      );
    }
  };

  return (
    <>
      <div className="message-area">
        {messages && messages.map(showMessage)}
        <span ref={bottomPos}></span>
      </div>

      <form className="message-form" onSubmit={sendMessage}>
        <input
          className="message-input"
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="Message..."
        />

        <button type="submit" disabled={!formValue}>
          ➡️
        </button>
      </form>
    </>
  );
}

function Message(props) {
  const { text, uid, photoURL } = props.message;
  const isSameAuthor = props.isSameAuthorAsAbove;

  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";

  return (
    <>
      <div
        className={`message ${messageClass} ${
          isSameAuthor ? "message-text-only" : ""
        }`}
      >
        {isSameAuthor ? (
          <p className="message-text">{text}</p>
        ) : (
          <div align={messageClass === "sent" ? "right" : "left"}>
            <div className="message-header">
              <img src={photoURL || "https://i.stack.imgur.com/34AD2.jpg"} />
              <p className="message-author">{props.author}</p>
            </div>
            <div>
              <p className="message-text">{text}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  };

  return (
    <>
      <div className="sign-in-container">
        <h1>Welcome to Asmir's Chat App!</h1>
        <button className="sign-in" onClick={signInWithGoogle}>
          Sign in with Google
        </button>
      </div>
    </>
  );
}

function SignOut() {
  return (
    auth.currentUser && (
      <button className="sign-out" onClick={() => auth.signOut()}>
        Sign Out
      </button>
    )
  );
}

export default App;
