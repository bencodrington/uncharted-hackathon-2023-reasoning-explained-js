import Head from 'next/head';
import { useState } from 'react';
import styles from './index.module.css';

const DEMO_INPUT = [
  {
    name: 'Select demo paragraph',
    input: ''
  },
  {
    name: 'Dogs in restaurants',
    input:
      "If we make an exception for Bijal's service dog, then other people will want to bring their dogs. Then everybody will bring their dog, and before you know it, our restaurant will be overrun with dogs, their slobber, their hair, and all the noise they make, and nobody will want to eat here anymore."
  },
  {
    name: 'Marketing strategist',
    input:
      'The company increased our marketing budget last week, and we hired a new marketing strategist. Our lead conversion rate increased by 15% from the last week. I believe the new marketing strategist is the reason for the increase in lead conversion.'
  },
  {
    name: 'Apples',
    input:
      "Apples are red. Apples are not red."
  },
  {
    name: 'Apples and Restaurants',
    input:
      "Apples are red. The restaurant opens at five o'clock and it begins serving between four and nine. Apples are not red."
  }
];

export function Result(props) {
  return (
    <div>
      <section>
        <strong>Hypothesis</strong>
        <p>{props.result.hypothesis}</p>
      </section>
      <section>
        <strong>Evidence</strong>
        <ul>
          {props.result.evidence.map((evidence, index) => (
            <li key={index}>{evidence}</li>
          ))}
        </ul>
      </section>
      <section>
        <strong>Assumptions</strong>
        <ul>
          {props.result.assumptions.map((assumption, index) => (
            <li key={index}>{assumption}</li>
          ))}
        </ul>
      </section>
      <section>
        <strong>Fallacies</strong>
        <ul>
          {props.result.fallacies.map((fallacy, index) => (
            <li key={index}>
              {fallacy.type}. Relevant excerpts:
              <ul>
                {fallacy.relevantExcerpts.map((excerpt, index) => (
                  <li key={index}>{excerpt}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Head>
        <title>OpenAI Quickstart</title>
        <link rel="icon" href="/dog.png" />
      </Head>

      <main className={styles.main}>
        <h3>Assess logic</h3>
        <select onChange={e => setUserInput(e.target.value)}>
          {DEMO_INPUT.map(input => (
            <option key={input.input} value={input.input}>
              {input.name}
            </option>
          ))}
        </select>
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
        {isLoading ? 'Loading...' : result === null ? null : <Result result={result} />}
      </main>
    </div>
  );
}
