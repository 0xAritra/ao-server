import axios from "axios"
import express, { json } from "express"
import { connect } from "@permaweb/aoconnect"
import { readFileSync } from "fs"
import { createDataItemSigner } from "@permaweb/aoconnect"
import dotenv from "dotenv"
import OpenAI from "openai"
import fs from "fs"

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const app = express()

app.use(express.json())
// Connect to AO
const ao = connect({
  MU_URL: "https://mu.ao-testnet.xyz",
  CU_URL: "https://cu.ao-testnet.xyz",
  GATEWAY_URL: "https://arweave.net",
})

// Destructure required functions from ao
const { message } = ao

// Read wallet file

const wallet = fs.readFileSync("./testWallet.json").toString()
const signer = createDataItemSigner(JSON.parse(wallet))

app.get("/join", async (req, res) => {
  const id = req.query

  try {
    const result = await message({
      process: "llyqIaAuCOF9x3d_GW67Kox8TZOt3sfQsReyTYtjP0g",
      tags: [{ name: "Action", value: "Register" }],
      signer: signer,
      data: "testtt",
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// API endpoint to send message
app.post("/send-message", async (req, res) => {
  const msg = req.body.msg
  try {
    const result = await message({
      process: "llyqIaAuCOF9x3d_GW67Kox8TZOt3sfQsReyTYtjP0g",
      tags: [{ name: "Action", value: "Broadcast" }],
      signer: signer,
      data: msg,
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

//API for fetching News
app.get("/gpt", async (req, res) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say a random fact about web 3 or crypto or blockchain",
        },
      ],
      temperature: 1,
      max_tokens: 90,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    const msg = response.choices[0].message.content

    const result = await message({
      process: "llyqIaAuCOF9x3d_GW67Kox8TZOt3sfQsReyTYtjP0g",
      tags: [{ name: "Action", value: "Broadcast" }],
      signer: signer,
      data: JSON.stringify(msg),
    })
    console.log(result) //messageId

    res.json(msg)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/askgpt", async (req, res) => {
  const query = req.body.query

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You're a helpful assistant, answer what the user asks you",
        },
        {
          role: "user",
          content: `${query}`,
        },
      ],
      temperature: 1,
      max_tokens: 90,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    const msg = response.choices[0].message.content

    const result = await message({
      process: "llyqIaAuCOF9x3d_GW67Kox8TZOt3sfQsReyTYtjP0g",
      tags: [{ name: "Action", value: "Broadcast" }],
      signer: signer,
      data: JSON.stringify(msg),
    })
    res.json({ msg })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

const NEWS_API_URL = "https://newsapi.org/v2/everything"

app.post("/news", async (req, res) => {
  try {
    const keyword = req.body.keyword || "Crypto"
    const response = await axios.get(
      `${NEWS_API_URL}?q=${keyword}&from=2024-03-28&sortBy=popularity`,
      {
        headers: {
          "X-Api-Key": process.env.NEWS_API_KEY,
        },
      }
    )

    if (response.data && response.data.articles) {
      const news = response.data.articles.map((data) => data.title)
      console.log(news)

      const result = await message({
        process: "llyqIaAuCOF9x3d_GW67Kox8TZOt3sfQsReyTYtjP0g",
        tags: [{ name: "Action", value: "Broadcast" }],
        signer: signer,
        data: JSON.stringify(news),
      })

      console.log(result) //MessageId
      res.json(news)
    } else {
      console.error("Invalid API response:", response.data)
      res.status(500).json({ error: "An error occurred" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "An error occurred" })
  }
})

app.get("/test", async (req, res) => {
  try {
    const msg = [
      {
        hi: "hello",
        vamsi: "AP",
      },
      {
        aritra: "Chennai",
      },
    ]

    const result = await message({
      process: "llyqIaAuCOF9x3d_GW67Kox8TZOt3sfQsReyTYtjP0g",
      tags: [{ name: "Action", value: "Broadcast" }],
      signer: signer,
      data: "Inbox",
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Start the server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
