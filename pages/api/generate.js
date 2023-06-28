import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

async function identifyExplicitStatements(userInput) {
  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'You will be provided a paragraph. Identify explicit statements in the paragraph and return them as a JSON array of strings. If there are none, simply return [].'
      },
      { role: 'user', content: userInput }
    ],
    temperature: 0
  });
  const statementsJsonString = completion.data.choices[0].message.content;
  console.log(statementsJsonString);
  return JSON.parse(statementsJsonString);
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
    const statements = await identifyExplicitStatements(userInput);

    // unstatedAssumptions = identifyUnstatedAssumptions(userInput)
    // finalAssertionsList = deduplicate(statements, unstatedAssumptions)
    // contradictions = identifyContradictions(finalAssertionsList)
    // fallacies = identifyFallacies(finalAssertionsList)
    // res.status(200).json({ result: fallacies });

    res.status(200).json({ result: statements });
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
