require("dotenv").config();

const express = require("express");
const cors = require("cors");
const dns = require("dns");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

app.use(express.json());
app.use(cors());

const client = new MongoClient(mongoUri);

const runMongo = async () => {
    try {
        await client.connect();

        console.log("✅ MongoDB Connected");

        const db = client.db("Todo");
        const collection = db.collection("Todo collection");

        app.get("/", (req, res) => {
            res.status(200).json({
                success: true,
                message: "Server is running"
            })
        })

        app.post("/add-task", async (req, res) => {
            try {
                const { taskValue } = req.body;

                if (!taskValue || !taskValue.trim()) {
                    return res.status(400).json({
                        success: false,
                        message: "Task is required",
                    });
                }

                const result = await collection.insertOne({
                    taskValue,
                });

                res.status(201).json({
                    success: true,
                    message: "Task Added Successfully",
                    insertedId: result.insertedId,
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.get("/all-task", async (req, res) => {
            try {
                const tasks = await collection.find().toArray();

                res.status(200).json(tasks);
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.delete("/remove-task/:id", async (req, res) => {
            try {
                const { id } = req.params;

                const result = await collection.deleteOne({
                    _id: new ObjectId(id),
                });

                if (result.deletedCount === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Task not found",
                    });
                }

                res.status(200).json({
                    success: true,
                    message: "Task Deleted Successfully",
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.patch("/edit-task/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const { taskValue } = req.body;

                if (!taskValue || !taskValue.trim()) {
                    return res.status(400).json({
                        success: false,
                        message: "Task is required",
                    });
                }

                const result = await collection.updateOne(
                    {
                        _id: new ObjectId(id),
                    },
                    {
                        $set: {
                            taskValue,
                        },
                    }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Task not found",
                    });
                }

                res.status(200).json({
                    success: true,
                    message: "Task Updated Successfully",
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
};

runMongo();

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});