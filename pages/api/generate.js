import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

async function identifyHypothesis(userInput) {
  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'You are a philosopher specializing in formal argumentation. The user will enter text representing an argument. Identify the main conclusion or hypothesis of the argument. Return it as a simple string with no words before or after.'
      },
      { role: 'user', content: userInput }
    ],
    temperature: 0
  });
  return completion.data.choices[0].message.content;
}

async function identifyEvidence(userInput, hypothesis) {
  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'You are a philosopher specializing in formal argumentation. The user will enter text representing an argument and the main conclusion or hypothesis of the argument. Identify all evidence the author has provided to support the conclusion. Return the evidence as a JSON array of strings. If there is no evidence, simply return [].'
      },
      { role: 'user', content: `Argument:${userInput}\nConclusion:${hypothesis}` }
    ],
    temperature: 0
  });
  const evidenceJsonString = completion.data.choices[0].message.content;
  return JSON.parse(evidenceJsonString);
}

async function identifyAssumptions(userInput, hypothesis) {
  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'You are a philosopher specializing in formal argumentation. The user will enter text representing an argument and the main conclusion or hypothesis of the argument. Identify any assumptions made in the argument to support the conclusion. Return the assumptions as a JSON array of strings with no output before or after. If there are no assumptions, simply return [].'
      },
      { role: 'user', content: `Argument:${userInput}\nConclusion:${hypothesis}` }
    ],
    temperature: 0
  });
  const assumptionJsonString = completion.data.choices[0].message.content;
  return JSON.parse(assumptionJsonString);
}

async function identifyFallacies(userInput, hypothesis) {
  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'You are a philosopher specializing in formal argumentation. The user will enter text representing an argument and the main conclusion or hypothesis of the argument. Identify any logical fallacies made in the argument to support the conclusion. Format the response as a JSON array of objects. Each object should have a "type" property and a "relevantExcerpts" property that lists any excerpts from the argument that were relevant to that fallacy. If there are no fallacies, simply return [].'
      },
      { role: 'user', content: `Argument:${userInput}\nConclusion:${hypothesis}` }
    ],
    temperature: 0
  });
  const fallacyJsonString = completion.data.choices[0].message.content;
  return JSON.parse(fallacyJsonString);
}

async function identifyAll(userInput) {
  const msgs = [
    {
      role: 'system',
      content:
        'You are a philosopher specializing in formal argumentation. The user will enter text representing an ' +
        'argument. In response provide the following: ' +
        "Step 1 - Identify the main hypothesis of the argument. We will refer to this as 'hypothesis'. " +
        "Step 2 - List the evidence the author has provided to support the conclusion from step 1. We will refer to these as 'evidence'. " +
        "Step 3 - List any assumptions made to support the conclusion from step 1. We will refer to these as 'assumptions'. " +
        "Step 4 - List any logical fallacies detected in reaching the conclusion. We will refer to these as 'fallacies'. " +
        ' Format the response as a json object with a hypothesis property, an array of evidence, an array of assumptions, and an array of fallacies.'
      // " Format the response as a json object with an array of nodes. Each node should have a 'type' property and a 'description' property, and an 'id' property containing a unique integer identifier." /* Also add an array 'links' to the json object relating the evidence to the hypothesis Each link should have a 'source' property and a 'target' property, each containing the id of a node." */
    },
    { role: 'user', content: userInput }
  ];

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: msgs,
    temperature: 0.6
  });

  const resultJsonString = completion.data.choices[0].message.content;
  console.log('resultJsonString', resultJsonString);
  return JSON.parse(resultJsonString);
}

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: 'OpenAI API key not configured, please follow instructions in README.md'
      }
    });
    return;
  }

  const method = req.body.method;

  const userInput = req.body.userInput || '';
  if (userInput.trim().length === 0) {
    res.status(400).json({
      error: {
        message: 'Please enter valid input.'
      }
    });
    return;
  }

  try {
    if (method === 'steps') {
      res.status(200).json({
        result: await identifyAll(userInput)
      });
      return;
    }
    const hypothesis = await identifyHypothesis(userInput);
    console.log('hypothesis', hypothesis);
    const [evidence, assumptions, fallacies] = await Promise.all([
      identifyEvidence(userInput, hypothesis),
      identifyAssumptions(userInput, hypothesis),
      identifyFallacies(userInput, hypothesis)
    ]);
    console.log('evidence', evidence);
    console.log('assumptions', assumptions);
    console.log('fallacies', fallacies);

    res.status(200).json({
      result: {
        hypothesis,
        evidence,
        assumptions,
        fallacies
      }
    });
  } catch (error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: 'An error occurred during your request.'
        }
      });
    }
  }
}
