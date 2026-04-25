import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [name, setName] = useState('');

  const sendData = async () => {
    try {
      // Hum apne backend (Port 5000) ko data bhej rahe hain
      const response = await axios.post('http://localhost:5000/add-data', {
        name: name
      });
      alert("Data successfully added!");
      setName(''); // Input clear karne ke liye
    } catch (error) {
      console.error("Error bhejte waqt:", error);
      alert("Kuch gadbad ho gayi!");
    }
  };

  return (
    <div style={{ padding: '50px' }}>
      <h1>Supabase Data Adder</h1>
      <input 
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Enter Name"
      />
      <button onClick={sendData}>Send to Backend</button>
    </div>
  );
}

export default App;