/**
 * 总路由配置
 */

const router = require('express').Router();

router.use('/user/', require('./User'));
router.use('/music/', require('./Music'));
router.use('/comment/', require('./Comment'));
router.use('/playlist/', require('./Playlist'));

module.exports = router;
