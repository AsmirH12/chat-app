import "./App.css";
import React, { useState, useRef } from "react";

import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import "firebase/compat/analytics";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

firebase.initializeApp({
  apiKey: "AIzaSyBsMFXIJL4tTUA_UR5PQfVtPshjedECXHQ",
  authDomain: "chat-app-8be11.firebaseapp.com",
  projectId: "chat-app-8be11",
  storageBucket: "chat-app-8be11.appspot.com",
  messagingSenderId: "848769319096",
  appId: "1:848769319096:web:6f23fb7804fa04b5c3744d",
  measurementId: "G-W292J4T3EZ",
});

const auth = firebase.auth();
const firestore = firebase.firestore();
const roomsRef = firestore.collection("rooms");

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <SignOut />
      </header>

      <section>{user ? <HomePage /> : <SignIn />}</section>
    </div>
  );
}

function HomePage() {
  //const query = roomsRef.orderBy("createdAt");
  //const [rooms] = useCollectionData(query);
  const [currentRoom, setCurrentRoom] = useState("Sports"); // fix this

  return (
    <div className="homepage">
      <h1 className="current-room-indicator">{currentRoom}</h1>
      <hr></hr>
      <SideBar setRoomIdentifier={setCurrentRoom} />
      <Room identifier={currentRoom} />
    </div>
  );
}

function SideBar({ setRoomIdentifier }) {
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
    <div className="sidebar">
      <div className="rooms">
        <button className="create-room" onClick={openCreateRoomModal}>
          <img src="plus.png"></img>

          <p>New room</p>
        </button>
        {rooms &&
          rooms.map((room) => (
            <button
              className="room-button"
              onClick={() => setRoomIdentifier(room.name)}
              key={room.name}
            >
              {room.name}
            </button>
          ))}
      </div>

      {isModalOpen && (
        <form className="create-room-modal" onSubmit={handleNewRoomSubmit}>
          <div class="room-name">
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
          <div>
            <button type="button" onClick={handleNewRoomCancel}>
              Cancel
            </button>
          </div>
          {doesRoomExist && (
            <p className="room-exist-error">That room already exists</p>
          )}
        </form>
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

  return (
    <>
      <div className="message-area">
        {messages &&
          messages.map((msg) => (
            <Message key={msg.id} message={msg} author={msg.displayName} />
          ))}
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

  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";

  return (
    <>
      <div className={`message ${messageClass}`}>
        <div>
          <img src={photoURL || "https://i.stack.imgur.com/34AD2.jpg"} />
        </div>
        <div className="message-vertical">
          <p>{props.author}</p>
          <p className="message-text">{text}</p>
        </div>
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
