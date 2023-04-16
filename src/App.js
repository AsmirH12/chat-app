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
  const [currentRoom, setCurrentRoom] = useState("Sports");

  return (
    <>
      <h1>Home Page</h1>
      <SideBar setRoomIdentifier={setCurrentRoom} />
      <Room identifier={currentRoom} />
    </>
  );
}

function SideBar({ setRoomIdentifier }) {
  const query = roomsRef.orderBy("createdAt");
  const [rooms] = useCollectionData(query);
  return (
    <>
      {rooms &&
        rooms.map((room) => (
          <button onClick={() => setRoomIdentifier(room.name)}>
            {room.name}
          </button>
        ))}
    </>
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

    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
    });

    setFormValue("");
    bottomPos.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {messages && messages.map((message) => <p>{message.text}</p>)}
      <span ref={bottomPos}></span>

      <form onSubmit={sendMessage}>
        <input
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
        <img src={photoURL || "https://i.stack.imgur.com/34AD2.jpg"} />
        <p>{text}</p>
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
      <button className="sign-in" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
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
