export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.redirect('/?error=no_code');
  try {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const redirectUri = proto + '://' + req.headers.host + '/api/callback';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: process.env.LINE_CHANNEL_ID,
      client_secret: process.env.LINE_CHANNEL_SECRET
    });
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const token = await tokenRes.json();
    if (!token.access_token) throw new Error(JSON.stringify(token));
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: 'Bearer ' + token.access_token }
    });
    const profile = await profileRes.json();
    const user = encodeURIComponent(JSON.stringify({
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl
    }));
    res.redirect('/?user=' + user);
  } catch (e) {
    res.redirect('/?error=' + encodeURIComponent(e.message));
  }
}
