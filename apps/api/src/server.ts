import express from 'express';
import { generateAnswer } from '../../../packages/ai/llm';
import { retrieveContext } from '../../../packages/ai/search';

const app = express();
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.post('/ask', async (req, res) => {
  const { question } = req.body;

  const context = await retrieveContext(question);

  const answer = await generateAnswer(
    `Context: ${context.join('\n')}
    Question: ${question}`,
  );

  res.json({ answer, context });
});

app.listen(3001, () => {
  console.log('API running on 3001');
});
