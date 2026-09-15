import express from 'express';
import session from 'express-session';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';

import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cors from 'cors';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;


app.use(helmet({

  contentSecurityPolicy: false
}));
app.use(compression());
app.use(morgan('tiny'));
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.enable('trust proxy');
app.use(session({

  secret: process.env.SESSION_SECRET || 'boogie-secret-key-4241',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));



app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {

  done(null, user.username);
});

passport.deserializeUser(async (username, done) => {

  try {

    const user = await usersCollection.findOne({ username });
    done(null, user || { username });
  } 
  catch (err) {

    done(err, null);
  }
});

passport.use(new GitHubStrategy({

    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL || "http://localhost:3000/auth/github/callback"
  },
  async (accessToken, refreshToken, profile, done) => {

    try {

      const username = profile.username;
      let user = await usersCollection.findOne({ username });

      if (!user) {

        user = {

          username: username,
          githubId: profile.id,
          displayName: profile.displayName || username,
          createdAt: new Date()
        };
        await usersCollection.insertOne(user);
      }
      return done(null, user);
    } 
    catch (err) {

      return done(err, null);
    }
  }
));



const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let scoresCollection;
let usersCollection;

async function run() {

  try {

    await client.connect();
    const db = client.db('blackholeboogie');
    scoresCollection = db.collection('scores');
    usersCollection = db.collection('users');
    console.log('Connected to MongoDB Atlas');
  } 
  catch (err) {

    console.error('Database connection error:', err);
  }
}
run();



function computeDerived(data) {

  const score = parseInt(data.score, 10) || 0;
  const duration = Math.max(parseInt(data.duration, 10) || 1, 1);
  const pps = score / duration;

  let rankTier = 'C Rank'
  if ( pps >= 12 ) {

    rankTier = 'S Rank'
  }
  else if ( pps >= 8 ) {

    rankTier = 'A Rank'
  }
  else if ( pps >= 4 ) {

    rankTier = 'B Rank'
  }

  return {
    pps: pps.toFixed(2),
    rankTier
  }
}



function requireAuth(req, res, next) {

  const username = req.user?.username || req.session?.username;
  if (username) {

    return next();
  }
  res.status(401).json({ error: 'Unauthorized. Please log in.' });
}


app.post('/api/login', async (req, res) => {

  const { username, password } = req.body;
  if (!username || !password) {

    return res.status(400).json({ error: 'Username and password required' });
  }

  const cleanUser = username.trim();
  try {

    let user = await usersCollection.findOne({ username: cleanUser });

    if (!user) {

      user = {

        username: cleanUser, 
        password, 
        authType: 'local', 
        createdAt: new Date() 
      };
      await usersCollection.insertOne(user);
    } 
    else if (user.password && user.password !== password) {

      return res.status(401).json({ error: 'Incorrect password' });
    }

    req.session.username = cleanUser;
    res.json({ username: cleanUser });
  } 
  catch (err) {

    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during authentication' });
  }
});


app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);


app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {

    req.session.username = req.user.username;
    res.redirect('/');
  }
);


app.get('/api/user', (req, res) => {

  const username = req.user?.username || req.session?.username || null;
  res.json({ username });
});


app.post('/api/logout', (req, res, next) => {

  req.logout((err) => {

    if (err) return next(err);
    req.session.destroy(() => {

      res.json({ success: true });
    });
  });
});


app.get('/data', requireAuth, async (req, res) => {

  const username = req.user?.username || req.session?.username;
  const userScores = await scoresCollection
    .find({ username })
    .sort({ score: -1 })
    .toArray();
  res.json(userScores);
});


app.post('/submit', requireAuth, async (req, res) => {

  const username = req.user?.username || req.session?.username;
  const payload = req.body;
  const derived = computeDerived(payload);

  const entry = {

    username,
    score: parseInt(payload.score, 10) || 0,
    duration: parseInt(payload.duration, 10) || 1,
    difficulty: payload.difficulty || 'Normal',
    notes: payload.notes || '',
    pps: derived.pps,
    rankTier: derived.rankTier,
    createdAt: new Date()
  };

  await scoresCollection.insertOne(entry);
  const updatedData = await scoresCollection
    .find({ username })
    .sort({ score: -1 })
    .toArray();
  res.json(updatedData);
});


app.post('/edit', requireAuth, async (req, res) => {

  const username = req.user?.username || req.session?.username;
  const payload = req.body;
  const derived = computeDerived(payload);

  await scoresCollection.updateOne(
    { _id: new ObjectId(payload.id), username },
    {
      $set: {

        score: parseInt(payload.score, 10) || 0,
        duration: parseInt(payload.duration, 10) || 1,
        difficulty: payload.difficulty || 'Normal',
        notes: payload.notes || '',
        pps: derived.pps,
        rankTier: derived.rankTier
      }
    }
  );

  const updatedData = await scoresCollection
    .find({ username })
    .sort({ score: -1 })
    .toArray();
  res.json(updatedData);
});


app.post('/delete', requireAuth, async (req, res) => {

  const username = req.user?.username || req.session?.username;
  const payload = req.body;

  await scoresCollection.deleteOne({

    _id: new ObjectId(payload.id),
    username
  });

  const updatedData = await scoresCollection
    .find({ username })
    .sort({ score: -1 })
    .toArray();
  res.json(updatedData);
});



app.use(express.static(path.join(__dirname, 'public')));
app.listen(port, () => console.log(`Server listening on port ${port}`));