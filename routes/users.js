const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
    join,
    login,
    passwordResetRequest,
    passwordResetPage,
    passwordReset
} = require('../controller/UserController');

// 폼 데이터와 JSON 파싱 미들웨어
router.use(express.urlencoded({ extended: true }));  // 폼 데이터를 처리하기 위해 추가
router.use(express.json());  // JSON 데이터를 처리하기 위해 추가

// 유효성 검사 결과 확인 미들웨어
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        next();
    } else {
        return res.status(400).json({ errors: errors.array() });
    }
};

// 유효성 검사 규칙 미들웨어
const validateLogin = [
    body('email').notEmpty().isEmail().withMessage('유효한 이메일을 입력해주세요'),
    body('password').notEmpty().isString().withMessage('비밀번호를 입력해주세요'),
    validate
];

const validateRegister = [
    body('email').notEmpty().isEmail().withMessage('유효한 이메일을 입력해주세요'),
    body('password').notEmpty().isString().withMessage('비밀번호를 입력해주세요'),
    validate
];

const validatePasswordResetRequest = [
    body('email').notEmpty().isEmail().withMessage('유효한 이메일을 입력해주세요'),
    validate
];

const validatePasswordReset = [
    body('token').notEmpty().withMessage('유효한 토큰을 제공해주세요'),
    body('newPassword').notEmpty().isString().withMessage('새로운 비밀번호를 입력해주세요'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('비밀번호가 일치하지 않습니다.');
        }
        return true;
    }),
    validate 
];



router.post('/join', validateRegister, join); // 회원가입
router.post('/login', validateLogin, login); // 로그인
router.post('/password-reset-request', validatePasswordResetRequest, passwordResetRequest); // 비밀번호 초기화 요청
router.post('/reset-password', validatePasswordReset, passwordReset); // POST 지원
router.put('/reset-password', validatePasswordReset, passwordReset);  // PUT 지원
router.get('/reset-password', passwordResetPage); // 비밀번호 재설정 페이지 제공 라우트

module.exports = router;
