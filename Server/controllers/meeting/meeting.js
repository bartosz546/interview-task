const MeetingHistory = require('../../model/schema/meeting')
const mongoose = require('mongoose');

const add = async (req, res) => {
    const {agenda, attendes, attendesLead, location, related, dateTime, notes, createBy, timestamp} = req.body;

    const meeting = {agenda, attendes, attendesLead, location, related, dateTime, notes, createBy, timestamp}
    const result = new MeetingHistory(meeting);
    await result.save();
    res.status(200).json({result});
}

const index = async (req, res) => {
    try {

        const query = req.query
        if (query.sender) {
            query.sender = new mongoose.Types.ObjectId(query.sender);
        }
        let result = await MeetingHistory.aggregate([
            { $match: { ...query, deleted: false } },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {$unwind: {path: '$user', preserveNullAndEmptyArrays: true}},
            {
                $addFields: {
                    createdByName: {
                        $concat: ["$user.firstName", " ", "$user.lastName"],
                    },
                },
            },
            { $project: { user: 0 } },
        ]);

        res.status(200).json(result);
    } catch (err) {
        console.error('Failed :', err);
        res.status(400).json({err, error: 'Failed '});
    }
}

const view = async (req, res) => {
    try {
        let result = await MeetingHistory.findOne({_id: req.params.id});
        let response = await MeetingHistory.aggregate([
            {$match: {_id: result._id}},
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {$unwind: "$user"},
            {
                $addFields: {
                    createdByName: {
                        $concat: ["$user.firstName", " ", "$user.lastName"],
                    },
                }
            }
        ]);
        if (!response) {
            return res.status(404).json({message: "no Data Found."});
        }
        res.status(200).json(response[0]);
    } catch (err) {
        console.log("Error:", err);
        res.status(400).json({Error: err});
    }
}

const deleteData = async (req, res) => {
    try {
        const result = await MeetingHistory.findByIdAndUpdate(req.params.id, {
            deleted: true,
        });
        res.status(200).json({message: "done", result});
    } catch (err) {
        res.status(404).json({message: "error", err});
    }
}

const deleteMany = async (req, res) => {
    try {
        const result = await MeetingHistory.updateMany(
            {_id: {$in: req.body}},
            {$set: {deleted: true}}
        );

        if (result?.matchedCount > 0 && result?.modifiedCount > 0) {
            return res
                .status(200)
                .json({message: "Meetings Removed successfully", result});
        } else {
            return res
                .status(404)
                .json({success: false, message: "Failed to remove Meetings"});
        }
    } catch (err) {
        return res.status(404).json({success: false, message: "error", err});
    }
}

module.exports = {add, index, view, deleteData, deleteMany}