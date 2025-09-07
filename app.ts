import { Request, Response } from 'express';
import dotenv from 'dotenv';
import express from 'express';
import logger from 'morgan';
import { handleGPXFile } from './src/logic/MainImport';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(logger("dev"));

app.use(logger("dev"));

app.use(express.text({limit:"50mb"}));
app.use(express.json({ limit: "50mb" }));

// Allow up to 50 MB for URL-encoded form data
app.use(express.urlencoded({ limit: "50mb", extended: true }));
// Add a GET handler
app.get("/", (req: Request, res: Response) => {
  //console.log("Content-Type:", req.get("Content-Type"));
  res.json({ message: "Hello from GET!" });
});

// POST handler
app.post("/", async (req: Request, res: Response) => {
  // Print the Content-Type header
  // console.log("Content-Type:", req.get("Content-Type"));
  
  //console.log(req.body);
  // Uncomment to use handleGPXFile
  // handleGPXFile(req.body, "test");
  const result =  await handleGPXFile(req.body, "test");
  res.json({  result });
});

app.listen(PORT, () => {
  console.info(`App listening on port ${PORT}`);
});