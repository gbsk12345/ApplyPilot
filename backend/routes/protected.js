// backend/routes/protected.js
import { supabaseAdmin } from '../lib/supabaseServerClient.js'

export async function handler(req, res) {
  const auth = req.headers.authorization || ''
  const token = auth.replace('Bearer ', '')
  const {
    data: { user },
    error
  } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // now you know who’s calling—attach `user` or their `user.id` to your logic
  res.json({ message: `Hello, ${user.email}` })
}
