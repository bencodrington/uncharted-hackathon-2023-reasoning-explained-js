import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);



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

    const userInput = req.body.userInput || '';
    if (userInput.trim().length === 0) {
        res.status(400).json({
            error: {
            message: `Please enter valid input.`
            }
        });
        return;
    }

    try {
        const result = await identifyArgumentThreads(userInput);

        res.status(200).json({ result });
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
