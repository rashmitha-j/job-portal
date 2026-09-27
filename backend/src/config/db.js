import mongoose from 'mongoose'

// Log connection lifecycle events after the initial connect
mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'))
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'))
mongoose.connection.on('error', (err) => console.error(`MongoDB error: ${err.message}`))

export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not defined. Add it to backend/.env (see .env.example).')
  }

  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`)
  return conn
}

export async function disconnectDB() {
  await mongoose.connection.close()
  console.log('MongoDB connection closed')
}
