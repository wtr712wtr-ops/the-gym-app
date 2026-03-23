export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const records = [{ id: 'rec001', userId, date: new Date().toISOString(), title: '上半身トレーニング', exercises: [{ name: 'ベンチプレス', sets: ['60kg x10回', '60kg x10回', '60kg x8回'] }, { name: 'ダンベルフライ', sets: ['12kg x12回', '12kg x10回'] }, { name: 'ケーブルロウ', sets: ['40kg x12回', '40kg x12回'] }], comment: '上半身全体をバランスよく鍛えました。ベンチプレスのフォームが改善されていてとても良かったです！次回は重量を少し上げてみましょう。' }];
  res.status(200).json(records);
}