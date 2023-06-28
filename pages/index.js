import Head from 'next/head';
import { useState } from 'react';
import styles from './index.module.css';

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState([]);

  async function onSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userInput: userInput })
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      console.log(data.result);

      setResult(data.result);
      setUserInput('');
    } catch (error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }

  return (
    <div>
      <Head>
        <title>OpenAI Quickstart</title>
        <link rel="icon" href="/dog.png" />
      </Head>

      <main className={styles.main}>
        {/* <img src="/dog.png" className={styles.icon} /> */}
        <h3>Name my pet</h3>
        <form onSubmit={onSubmit}>
          <input
            type="textarea"
            name="userInput"
            placeholder="Enter a paragraph"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            style={{'height': '400px'}}
          />
          <input type="submit" value="Generate names" />
        </form>
        {result.map((statement, index) => (
          <div key={index} className={styles.result}>
            {statement}
          </div>
        ))}
      </main>
    </div>
  );
}
