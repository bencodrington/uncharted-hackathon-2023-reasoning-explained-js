import Head from 'next/head';
import { useState } from 'react';
import styles from './index.module.css';

const ARTICLE = [
  'California Democrats might be proud of their progressive climate policies requiring the trucking industry to switch to zero-emission vehicles (ZEVs). But the rest of country will be paying for it.',
  "The state's Advanced Clean Trucks rule, adopted in 2020 and recently given a waiver from federal Clean Air Act provisions by President Biden's Environmental Protection Agency, will force truck manufacturers to sell increasing numbers of ZEVs until sales of trucks with conventional internal combustion engines are ended by the state's 2040 goal. Fourteen other states have adopted similar rules, and several more are in the process of doing so.",
  "It would be one thing if residents of those states bore the burden of such policies, but that won't be the case. Zero-emission heavy trucks can cost as much as $120,000 more than a comparable diesel-fueled model. That means trucking companies will either have to increase the prices they charge — if they can pass such costs onto consumers at all — or receive massive public subsidies. Either way, Americans across the country will pay.",
  'Another California policy set to take effect in January could cause even more havoc. The Advanced Clean Fleets rule will make trucking operators buy the vehicles the state is forcing manufacturers to sell, essentially pushing truck fleet owners to buy costly ZEVs as they retire existing trucks.',
  'There might not even be enough ZEVs available to purchase to comply with the rule. While the California Air Resources Board states there are "over a hundred ZEV models available now," that does not mean production has ramped up to allow every purchaser to buy one when they need it. Exemptions in the rule will help fleet operators by allowing them a few years to bring their fleets into compliance, but complex reporting requirements for those exemptions will impose significant costs on companies that, again, will be passed on to consumers.',
  "Then there's the charging issue. Electric trucks have the same range issue as electric cars: They can only drive a few hundred miles before needing to recharge, which can take hours. Andrew Boyle of the American Trucking Association recently testified before Congress that it would take a truck five to 10 hours of charging to drive the same 1,200 miles that a 15-minute refill at a diesel pump would offer. That driver downtime significantly raises the cost of trucking.",
  "And that's assuming drivers can find suitable chargers at all. There are nowhere near enough chargers on California's highways — let alone in the sparsely populated desert regions neighboring the state — to satisfy even a fraction of the potential demand. Entrepreneurs are trying to meet the challenge, but it will take years to build the charging network, assuming that a state that suffers periodic blackouts can find enough energy to power it.",
  "Since the Golden State is so essential to the nation's import supply chain, any policy that would upend trucking there would affect everyone. More than 40 percent of the nation's imports flow through three of California's ports. If the trucking industry can't continue servicing those ports at the scale and cost that it currently manages, the entire country will pay more for goods and receive them less quickly. The chaos resulting from California's rules could make the supply chain interruptions of 2021 look minuscule by comparison.",
  'National problems require national solutions, not ideological crusades imposed by one state on all the others, which helps explain why 19 other states have filed suit in the U.S. Court of Appeals for the District of Columbia challenging the Advanced Clean Trucks rule. A far better approach would be for Biden and congressional Republicans to work together on a legislative approach to interstate trucking electrification that would prevent a potential election-year catastrophe from unfolding.',
  'Climate activists want rapid change, but large economies and industries cannot change overnight. This attempt to transform a crucial sector overnight is one California dream that could easily turn into a national nightmare.'
].join('\n');

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
    input: 'Apples are red. Apples are not red.'
  },
  {
    name: 'Apples and Restaurants',
    input:
      "Apples are red. The restaurant opens at five o'clock and it begins serving between four and nine. Apples are not red."
  },
  {
    name: 'Article',
    input: ARTICLE
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
