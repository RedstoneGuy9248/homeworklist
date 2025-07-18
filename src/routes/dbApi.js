/* 
/api/v1/db:
GET: params: limit?, page?, id?
     limit: limits amount of rows
     page: offset of (page - 1)(limit)
     id: gets row with specific id
POST: params: none, body: subject str, subdate? "YYYY-MM-DD", work str, length int
      returns id of added row
DELETE: params: id
        deletes row with specified id
PUT: params: id, body: subject, subdate, work, length
     updates row with specified id
PATCH: params: id, body: subject?, subdate?, work?, length? (ONE OR MORE NEEDED)
       updates specified data in row with specified id
*/
const express = require("express");
const moment = require("moment");
module.exports = (pool) => {
    const router = express.Router();
    router.route("/")
    //GET
    .get(async (req, res) => {
        let limit = 10;
        let page = 1;
        let id;
        if (req.query.id) {id = req.query.id};
        if (req.query.page) 
            {page = parseInt(req.query.page)};
        if (req.query.limit) 
            {limit = parseInt(req.query.limit)};
        if (!limit || !page) {return res.status(400).json({success: false, error: "int expected in limit/string"})}
        let offset = (page - 1) * (limit);
        let conn;
        try {
            conn = await pool.getConnection();
            let rows;
            if (id) {
                rows = await conn.query("SELECT * FROM WORKTODO WHERE ID = ?;", [id]);
            } else {
                rows = await conn.query("SELECT * FROM WORKTODO ORDER BY ID LIMIT ? OFFSET ?;", [limit, offset]);
            }
            if (rows && rows.length > 0) {res.status(200).json({success: true, data: rows})} else {res.status(400).json({success: false, error: "no data meets specifications"})};
        } catch(err) {
            console.log(err);
            res.status(500).send("error");
        } finally {if (conn) {conn.end()}};
    })
    //POST
    .post(async (req, res) => {
        if (!(req.body.subject && req.body.work && req.body.length)) {return res.status(400).json({success: false, error: "subject, work, and length needed"})};
        let { subject, work, length } = req.body;
        length = parseInt(length);
        if (!length) {return res.status(400).json({success:false, error: "limit should be int"})};
        let subdate
        if (!req.body.subdate) 
            {subdate = moment().add(1, "week").format("YYYY-MM-DD")}
        else if (moment(req.body.subdate, "YYYY-MM-DD", true).isValid()) 
            {subdate = req.body.subdate}
        else 
            {return res.status(400).json({success: false, error: "date should be of format YYYY-MM-DD"})};
        console.log(subdate);
        try {
            conn = await pool.getConnection();
            output = await conn.query("INSERT INTO WORKTODO (SUBJECT, DATE_SUBMISSION, WORK, LENGTH) VALUES (?, ?, ?, ?) RETURNING ID;", [subject, subdate, work, length]);
            res.status(200).json({success: true, id: output[0].ID});
        } catch(err) {res.status(500).send("error"); console.log(err)} finally {if (conn) {conn.end()}};
    })
    //DELETE
    .delete(async (req, res) => {
        if (!req.query.id) {return res.status(400).json({success:false, error: "specify id"})}
        let id = parseInt(req.query.id);
        if (!id) {return res.status(400).json({success:false, error: "id should be int"})};
        try {
            conn = await pool.getConnection();
            output = await conn.query("DELETE FROM WORKTODO WHERE ID = ?", [id]);
            if (output.affectedRows == 0) {success = false} else {success = true};
            res.status(200).json({success});
        } catch(err) {res.status(500).send("error"); console.log(err)} finally {console.log(output.affectedRows); if (conn) {conn.end()}};
    })
    //PUT
    .put(async (req, res) => {
        if (!req.query.id) {return res.status(400).json({success:false, error: "specify id"})}
        let id = parseInt(req.query.id);
        if (!id) {return res.status(400).json({success:false, error: "id should be int"})};
        if (!(req.body.subject && req.body.work && req.body.length && req.body.subdate)) {return res.status(400).json({success: false, error: "subject, work, length, and subdate needed"})};
        let { subject, work, length, subdate} = req.body;
        length = parseInt(length);
        if (!length) {return res.status(400).json({success:false, error: "limit should be int"})};
        if (moment(req.body.subdate, "YYYY-MM-DD", true).isValid()) 
            {subdate = req.body.subdate}
        else 
            {return res.status(400).json({success: false, error: "date should be of format YYYY-MM-DD"})};
        try {
            conn = await pool.getConnection();
            [id_found] = await conn.query("SELECT EXISTS(SELECT 1 FROM WORKTODO WHERE ID = ?) AS FOUND", id);
            console.log(id_found)
            if (!id_found.FOUND) {return res.status(400).json({success:false, error: "data with specified id doesnt exist"})}
            output = await conn.query("UPDATE WORKTODO SET SUBJECT = ?, DATE_SUBMISSION = ?, WORK = ?, LENGTH = ? WHERE ID = ?;", [subject, subdate, work, length, id]);
            res.status(200).json({success: true});
        } catch(err) {res.status(500).send("error"); console.log(err)} finally {if (conn) {conn.end()}};
    })
    //PATCH
    .patch(async (req, res) => {
        if (!req.query.id) {return res.status(400).json({success:false, error: "specify id"})}
        let id = parseInt(req.query.id);
        if (!id) {return res.status(400).json({success:false, error: "id should be int"})};
        if (Object.keys(req.body).length === 0) {return res.status(400).json({success:false, error: "specify at least one field to be updated"})};
        let subject; let work; let subdate; let length;
        if (req.body.subject) {subject = req.body.subject};
        if (req.body.work) {work = req.body.work}; 
        if (req.body.length) {length = req.body.length}; 
        if (req.body.subdate) {
            if (moment(req.body.subdate, "YYYY-MM-DD", true).isValid()) 
                {subdate = req.body.subdate}
            else 
                {return res.status(400).json({success: false, error: "date should be of format YYYY-MM-DD"})};
        }
        let query = [];
        let data = [];
        if (subject) {
            query.push `SUBJECT = ?`;
            data.push(subject);
        };
        if (subdate) {
            query.push `DATE_SUBMISSION = ?`;
            data.push(subdate);
        };
        if (work) {
            query.push `WORK = ?`;
            data.push(work);
        };
        if (length) {
            query.push `LENGTH = ?`;
            data.push(length);
        };
        data.push(id);
        let queryStr = query.join(", ");
        queryStr = "UPDATE WORKTODO SET " + queryStr + " WHERE ID = ?";
        try {
            conn = await pool.getConnection();
            [id_found] = await conn.query("SELECT EXISTS(SELECT 1 FROM WORKTODO WHERE ID = ?) AS FOUND", id);
            if (!id_found.FOUND) {return res.status(400).json({success:false, error: "data with specified id doesnt exist"})}
            output = await conn.query(queryStr, data);
            res.status(200).json({success: true});
        } catch(err) {res.status(500).send("error"); console.log(err)} finally {if (conn) {conn.end()}};
    });
    return router;
};