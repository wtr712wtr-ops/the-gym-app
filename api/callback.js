export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.redirect('/?error=no_code');
  try {
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: req.headers['x-forwarded-proto'] + '://' + req.headers.host + '/api/callback',
        client_id: process.env.LINE_CHANNEL_ID,
        client_secret: process.env.LINE_CHANNEL_SECRET
      })
    });
    const token = await tokenRes.json();
    if (!token.access_token) throw new Error('Token error');
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: 'Bearer ' + token.access_token }
    });
    const profile = await profileRes.json();
    const user = { userId: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl };
    res.redirect('/?user=' + encodeURIComponent(JSON.stringify(user)));
  } catch (e) {
    res.redirect('/?error=auth_failed');
  }
}