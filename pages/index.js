import Head from 'next/head';
import { useState } from 'react';
import styles from './index.module.css';

const DEMO_INPUT = [
  {
    name: 'Select demo paragraph',
    input:
      ""
  },
  {
    name: 'Dogs in restaurants',
    input:
      "If we make an exception for Bijal's service dog, then other people will want to bring their dogs. Then everybody will bring their dog, and before you know it, our restaurant will be overrun with dogs, their slobber, their hair, and all the noise they make, and nobody will want to eat here anymore."
  },
  {
    name: 'Marketing strategist',
    input:
      "The company increased our marketing budget last week, and we hired a new marketing strategist. Our lead conversion rate increased by 15% from the last week. I believe the new marketing strategist is the reason for the increase in lead conversion."
  },
  {
    name: 'Apples and Restaurants',
    input:
      "Apples are red. The restaurant opens at five o'clock and it begins serving between four and nine. Apples are not red."
  }
];

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
        <h3>Assess logic</h3>
        <form onSubmit={onSubmit}>
          <textarea
            name="userInput"
            placeholder="Enter a paragraph"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            style={{ height: '200px' }}
          />
          <input type="submit" value="Analyze" />
        </form>
        <select onChange={e => setUserInput(e.target.value)}>
          {DEMO_INPUT.map(input => (
            <option key={input.input} value={input.input}>
              {input.name}
            </option>
          ))}
        </select>
        {result.map((statement, index) => (
          <div key={index} className={styles.result}>
            {statement}
          </div>
        ))}
      </main>
    </div>
  );
}
