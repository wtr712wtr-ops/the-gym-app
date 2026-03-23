export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.redirect('/?error=no_code');
  try {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const redirectUri = proto + '://' + host + '/api/callback';
    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    body.append('code', code);
    body.append('redirect_uri', redirectUri);
    body.append('client_id', process.env.LINE_CHANNEL_ID);
    body.append('client_secret', process.env.LINE_CHANNEL_SECRET);
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    const token = await tokenRes.json();
    if (!token.access_token) throw new Error('no token');
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { 'Authorization': 'Bearer ' + token.access_token }
    });
    const profile = await profileRes.json();
    const user = JSON.stringify({ userId: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl });
    res.redirect('/?user=' + encodeURIComponent(user));
  } catch (e) {
    res.redirect('/?error=auth_failed&msg=' + encodeURIComponent(e.message));
  }
}
