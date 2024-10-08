const conn = require('../mariadb');
const { StatusCodes } = require('http-status-codes');

const addLike = (req, res) => {
    // 좋아요 추가
    const {id} = req.params; // book_id
    const {user_id} = req.body;

    let sql = "INSERT INTO likes (user_id, liked_book_id) VALUES (?, ?)";
    let values = [user_id, id];
    conn.query(sql, values,
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
            }
    
            return res.status(StatusCodes.OK).json(results);
    })
};

const removeLike = (req, res) => {
    // 좋아요 삭제(취소)
    const {id} = req.params; // book_id
    const {user_id} = req.body;

    let sql = "DELETE FROM likes WHERE user_id = ? AND liked_book_id = ?";
    let values = [user_id, id];
    conn.query(sql, values,
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
            }
    
            return res.status(StatusCodes.OK).json(results);
    })
};


module.exports = {
    addLike,
    removeLike
};