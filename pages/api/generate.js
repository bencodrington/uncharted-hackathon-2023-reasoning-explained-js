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


function trim_str (input) {
  const ignored_characters = new Set(["'", "\"", " ", "\t", "\n", "."]);
  while (ignored_characters.has(input.substring(0, 1))) {
      input = input.substring(1);
  }
  while (ignored_characters.has(input.substring(input.length - 1, input.length))) {
      input = input.substring(0, input.length - 1);
  }
  return input
}
async function identifyArgumentThreads (userInput) {
  const standard_request =
      `
      Please outline all arguments made in the article.
      Format the response as a JSON array of JSON objects, with the argument listed under the "argument" property.
      In each object, please also include the following properties:
          quotes - a list of all the quotes from the article that support the given argument
          assumptions - a list of assumptions (both explicit and implicit) assumed by the given argument
          fallacies - a list of logical fallacies that the argument might exhibit
          rating - the probability that the argument is true
      `
  const messages = [
      {role: "system", content: "what is the article we are discussing?"},
      {role: "assistant", content: userInput},
      {role: "user", content: standard_request}
  ]

  const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages
  })
  const result = completion.data.choices[0].message.content;
  try {
      JSON.parse(result);
  } catch (err) {
      return({
          message: 'Could not convert to JSON',
          input: userInput,
          output: result
      });
  }
  const result_json = JSON.parse(result);
  const ui_lower = userInput.toLowerCase();
  const final_result_json = result_json.map(element => {
      element.quotes = element.quotes.map((q, index) => {
          const q1 = trim_str(q);
          const q_result = { quote: q1 };
          const q_parts = q1.split("...").filter(part => part.length > 0);
          if (q_parts.length > 1) {
              const starts = q_parts.map(part => {
                  return ui_lower.indexOf(part.toLowerCase())
              });
              const min_start = Math.min.apply(starts);
              if (min_start < 0) {
                  q_result.found = false;
              } else {
                  q_result.found = true;
                  q_result.start = min_start;
                  const ends = q_parts.map(part => {
                      return ui_lower.indexOf(part.toLowerCase()) + part.length;
                  });
                  const max_end = Math.max.apply(ends);
                  q_result.end = max_end;
              }
          } else {
              const start = ui_lower.indexOf(q1.toLowerCase());
              if (start == -1) {
                  q_result.found = false;
              } else {
                  q_result.found = true;
                  q_result.start = start;
                  q_result.end = start + q1.length;
              }
          }
          return q_result;
      });
      return element;
  });
  return final_result_json;
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
    if (method === 'threads') {
      res.status(200).json({
        result: { threads: await identifyArgumentThreads(userInput) }
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
