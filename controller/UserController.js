const conn = require('../mariadb');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { StatusCodes } = require('http-status-codes');
const crypto = require('crypto'); // crypto 모듈 : 암호화
const dotenv = require('dotenv');
dotenv.config();

const join = (req, res) => {
    const { email, password } = req.body;

    let sql = 'INSERT INTO users (email, password, salt) VALUES (?, ?, ?)';

    // 암호화된 비밀번호와 salt 값을 같이 DB에 저장
    const salt = crypto.randomBytes(10).toString('base64');
    const hashPassword = crypto.pbkdf2Sync(password, salt, 10000, 10, 'sha512').toString('base64');
        
    let values = [email, hashPassword, salt];
    conn.query(sql, values, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "서버 오류로 인해 회원가입에 실패했습니다.",
                error: err.message
            });
        }

        res.status(StatusCodes.CREATED).json({
            message: "회원가입이 완료되었습니다.",
            results
        });
    });
};

const login = (req, res) => {
    const { email, password } = req.body;
    let sql = 'SELECT * FROM users WHERE email = ?';
    
    conn.query(sql, [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "서버 오류가 발생했습니다.",
                error: err.message
            });
        }

        const loginUser = results[0];

        // salt값 꺼내서 날 것으로 들어온 비밀번호를 암호화 해보고
        const hashPassword = crypto.pbkdf2Sync(password, loginUser.salt, 10000, 10, 'sha512').toString('base64');

        // => DB 비밀번호랑 비교
        if (loginUser && loginUser.password === hashPassword) {
            const token = jwt.sign({
                email: loginUser.email
            }, process.env.PRIVATE_KEY, {
                expiresIn: '5m',
                issuer: "nanyoung"
            });

            res.cookie("token", token, { httpOnly: true });
            res.status(StatusCodes.OK).json({ 
                message: `${loginUser.email}님, 로그인이 되었습니다!`,
                results
            });
        } else {
            res.status(StatusCodes.UNAUTHORIZED).json({ 
                message: "이메일 또는 비밀번호가 잘못되었습니다." 
            });
        }
    });
};

const passwordResetRequest = (req, res) => {
    const { email } = req.body;
    let sql = 'SELECT * FROM users WHERE email = ?';
    
    conn.query(sql, [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "서버 오류가 발생했습니다.",
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: '해당 이메일을 가진 사용자를 찾을 수 없습니다.' });
        }

        const user = results[0];
        const resetToken = jwt.sign({
            email: user.email
        }, process.env.PRIVATE_KEY, {
            expiresIn: '1h' 
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const resetLink = `http://localhost:9999/users/reset-password?token=${resetToken}`;
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: '비밀번호 재설정 요청',
            html: `
                <h1>비밀번호 재설정 요청</h1>
                <p>아래 링크를 클릭하여 비밀번호를 재설정해주세요.</p>
                <a href="${resetLink}">비밀번호 재설정</a>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "이메일 전송에 실패했습니다." });
            }

            res.status(StatusCodes.OK).json({
                message: `비밀번호 재설정 링크가 ${email}로 전송되었습니다.`,
            });
        });
    });
};


const passwordResetPage = (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "토큰이 필요합니다." });
    }

    // 클라이언트에 비밀번호 재설정 HTML 페이지 제공
    res.send(`
        <html>
            <body>
                <h1>비밀번호 재설정</h1>
                <form method="POST" action="/users/reset-password">
                    <input type="hidden" name="token" value="${token}" />
                    <label for="newPassword">새 비밀번호:</label>
                    <input type="password" name="newPassword" required />
                    <br />
                    <label for="confirmPassword">새 비밀번호 확인:</label>
                    <input type="password" name="confirmPassword" required />
                    <br />
                    <button type="submit">비밀번호 재설정</button>
                </form>
            </body>
        </html>
    `);
};


const passwordReset = (req, res) => {
    const { token, newPassword } = req.body;

    // JWT 토큰 검증
    jwt.verify(token, process.env.PRIVATE_KEY, (err, decoded) => {
        if (err) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "유효하지 않거나 만료된 토큰입니다." });
        }

        const email = decoded.email;

        // 암호화된 비밀번호와 salt 값을 함께 DB에 저장
        const salt = crypto.randomBytes(10).toString('base64');
        const hashPassword = crypto.pbkdf2Sync(newPassword, salt, 10000, 10, 'sha512').toString('base64');

        let updateSql = 'UPDATE users SET password = ?, salt = ? WHERE email = ?';

        conn.query(updateSql, [hashPassword, salt, email], (err, updateResults) => {
            if (err) {
                console.error(err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    message: "서버 오류로 인해 비밀번호를 초기화하지 못했습니다.",
                    error: err.message
                });
            }

            if (updateResults.affectedRows > 0) {
                res.status(StatusCodes.OK).json({ message: '비밀번호가 성공적으로 초기화되었습니다.' });
            } else {
                res.status(StatusCodes.NOT_FOUND).json({ message: '해당 이메일을 찾을 수 없습니다.' });
            }
        });
    });
};




module.exports = {
    join,
    login,
    passwordResetRequest,
    passwordResetPage,
    passwordReset
};
