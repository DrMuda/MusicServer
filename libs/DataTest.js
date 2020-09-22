/**
 * @desc 数据验证
 * @module DataTest
 */


class DataTest {


    /**
     * 验证姓名格式是否正确
     * @param {!string} str 必填，要验证的字符串
     * @param {!object} [config] 可选的配置对象
     * @param {string} config.type 验证的姓名是 中文zh 或 英文en
     * @param {number} config.min 姓名的最小长度，默认2
     * @param {number} config.max 姓名的最大长度，默认6
     * @param {boolean} config.case 是否忽略大小写，默认 true
     */
    name(str = "", config = {}) {
        // 判断config是否为空
        if (Object.keys(config).length === 0) {
            return /^[\u4e00-\u9fa5]{2,6}$/.test(str);
        };
        // 取出参数
        let { type = "zh", min = 2, max = 6, case: ignore = true } = config;
        // 验证传参
        if (DataTest.rmspace(str) === "" || typeof str !== "string") throw Error(`str的值不能为空，且必须是字符串类型`);
        if (/^(zh|en)$/i.test(type) === false) throw Error(`类型的值只能是 “zh” 或 “en”`);
        if (/^\d{0,200}$/.test(min) === false || /^\d{0,200}$/.test(max) === false) throw Error(`min和max只能是 0 ~ 200 之间`);
        if (typeof ignore !== "boolean") throw Error(`case的值只能是 true 或 false`);

        // 处理类型
        let range = type === "zh" ? `[\\u4e00-\\u9fa5]` : `[a-z]`;
        // 处理条件
        let flags = () => {
            let arr = [];
            if (ignore) arr.push("i");
            return arr.join("");
        };
        // 设置正则
        let reg = new RegExp(`^${range}{${min},${max}}$`, flags());
        // 返回验证信息
        return reg.test(str);
    }


    /**
     * 验证性别格式是否正确
     * @param {string} str 必选，要验证的性别字符串
     * @param {number} type 必选，1：(男|女)，2：(boy|girl)，3：(male|female)
     */
    sex(str, type) {
        if (!str || typeof str !== "string" || DataTest.rmspace(str) === "") return false;
        if (/^[1-3]$/.test(type) === false) throw Error(`type 不能为空，且值只能是 1~3 之间`);

        switch (type) {
            case 1:
                return /^(男|女)$/.test(str);

            case 2:
                return /^(boy|girl)$/.test(str);

            case 3:
                return /^(male|female)$/.test(str);

            default:
                throw Error(`type 不能为空，且值只能是 1~3 之间`);
        };

    }


    /**
     * 验证年龄格式是否正确
     * @param {(string|number)} str 年龄
     * @param {number} minAge 最小年龄，默认1
     * @param {number} maxAge 最大年龄，默认100
     */
    age(str, minAge = 1, maxAge = 100) {

        if (!str) return false;

        if (typeof minAge !== "number" || minAge < 1 || minAge > (maxAge || 100)) throw Error(`minAge ${minAge} 不合法，minAge必须是整数类型`);

        if (typeof maxAge !== "number" || maxAge < 1 || minAge > (maxAge || 100)) throw Error(`maxAge ${maxAge} 不合法，maxAge必须是整数类型`);

        if (/^\d+$/.test(str) === false || str < 1 || str > maxAge) {
            return false;
        }

        return str >= minAge && str <= maxAge;
    }


    /**
     * 验证手机号码格式是否正确
     * @param {(number|string)} str 要验证的手机号码
     */
    phone(str) {
        return /^1[3456789]\d{9}$/.test(str);
    }


    /**
     * 验证字符串是否是邮箱地址
     * @param {string} str 要验证的邮箱地址
     */
    email(str) {
        return /\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/.test(str);
    }


    /**
     * 验证字符串是否是QQ
     * @param {string} str 要验证的QQ号码
     */
    qq(str) {
        return /^\d{5,11}$/.test(str);
    }


    /**
     * 验证是否是合法的行政区域代码
     * @param {string} str 要验证的行政区代码（省市县三级）
     */
    addressCode(str) {
        return /^\d{6}$/.test(str);
    }



    /**
     * 验证是否是网址链接
     * @param {string} str 要验证的网址
     */
    link(str) {
        return /^https?:\/\/(([a-zA-Z0-9_-])+(\.)?)*(:\d+)?(\/((\.)?(\?)?=?&?[a-zA-Z0-9_-](\?)?)*)*/i.test(str);
    }


    /**
     * 验证字符串的长度
     * @param {string} str 要验证长度的字符串
     * @param {number} minLen 最短长度，不写则返回 str 的长度
     * @param {number} maxLen 最长长度，不写则返回 str 的长度
     */
    len(str, minLen, maxLen) {
        if (typeof str !== "string") return false;
        if (minLen && /^\d+$/.test(minLen) === false) throw Error(`minLen 必须是数值类型，而你的却是 ${minLen}`);
        if (maxLen && /^\d+$/.test(maxLen) === false) throw Error(`maxLen 必须是数值类型，而你的却是 ${minLen}`);
        if (minLen && maxLen) {

            if (minLen > maxLen) throw Error(`minLen ${minLen} 不合法`);
            if (maxLen < minLen) throw Error(`maxLen ${maxLen} 不合法`);
            if (minLen === maxLen) {
                return str.length === minLen;
            } else {
                return str.length >= minLen && str.length <= maxLen;
            };

        };
        return str.length;
    }


    /**
     * 验证字符串，是否全是由数字组成
     * @param {string} str 要验证的字符串
     * @param {number} [minlen] 最小长度
     * @param {number} [maxLen] 最大长度
     */
    fullNumber(str, minLen, maxLen) {
        if (!str && str !== 0) return false;
        if (minLen && maxLen && /^\d+$/.test(minLen) && /^\d+$/.test(maxLen)) {
            return new RegExp(`^\\d{${minLen},${maxLen}}$`).test(str);
        } else {
            return /^\d+$/.test(str);
        }
    }


    /**
     * 验证字符串，是否全是由中文组成
     * @param {string} str 要验证的字符串
     * @param {number} [minlen] 最小长度
     * @param {number} [maxLen] 最大长度
     */
    fullZh(str, minLen, maxLen) {
        if (!str) return false;
        if (minLen && maxLen && /^\d+$/.test(minLen) && /^\d+$/.test(maxLen)) {
            return new RegExp(`^[\\u-4e00-\\u9fa5]{${minLen},${maxLen}}$`).test(str);
        } else {
            return /^[\u4e00-\u9fa5]+$/.test(str);
        }
    }


    /**
    * 验证字符串，是否全是由字母组成
    * @param {string} str 要验证的字符串
    * @param {number} [minlen] 最小长度
    * @param {number} [maxLen] 最大长度
    */
    fullLetter(str, minLen, maxLen) {
        if (!str) return false;
        if (minLen && maxLen && /^\d+$/.test(minLen) && /^\d+$/.test(maxLen)) {
            return new RegExp(`^[a-z]{${minLen},${maxLen}}$`).test(str);
        } else {
            return /^[a-z]+$/.test(str);
        }
    }


    /**
   * 验证字符串，是否包含字母
   * @param {string} str 要验证的字符串
   */
    inLetter(str) { // include letter
        if (!str) return false;
        return /[a-z]+/img.test(str);
    }


    /**
     * 验证密码 格式是否正确，默认字母数字下划线组成，6~20位
     * @param {string} str 要验证的密码
     * @param {object} [config] 可选的配置信息，minLen: 最短长度，maxLen: 最大长度
     */
    password(str, config = {}) {
        if (!str) return false;
        if (Object.keys(config).length === 0) {
            return /^\w{6,20}$/.test(str);
        };
        let { minLen = 6, maxLen = 20 } = config;
        if (typeof minLen !== "number" || minLen < 1) throw Error(`minLen ${minLen} 不符合要求`);
        if (typeof maxLen !== "number" || maxLen < 1) throw Error(`maxLen ${maxLen} 不符合要求`);
        if (minLen === maxLen) return new RegExp(`^\\w{${minLen}}$`).test(str);
        return new RegExp(`^\\w{${minLen},${maxLen}}$`).test(str);
    }


    /**
     * 验证身份证号码是否符合格式
     * @param {string} str 必选，要验证的身份证号码
     */
    ident(str) {
        if (!str) return false;
        return /^(^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$)|(^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[Xx])$)$/.test(str);
    }


    /**
     * 判断内容是否是空的，也就是没有内容的，这个内容可以是普通字符串、数组、对象
     * @param {string} content 要验证非空的内容
     */
    empty(content) {
        // 判断数组
        if ((Array.isArray(content) && content.length === 0) || (Object.prototype.toString.call(content) === "[object Array]" && Object.keys(content).length === 0)) {
            return true;
        };

        // 判断对象
        if (Object.prototype.toString.call(content) === "[object Object]") {
            return Object.keys(content).length === 0;
        }

        // 判断普通字符
        content = DataTest.rmspace(content);
        return content ? false : true;
    }


    /**
     * 静态方法 —— 去除空白
     * @param {str} str 要去除空白符的字符串
     */
    static rmspace(str) {
        if (str && typeof str === "string") {
            return str.replace(/\s+/img, "");
        } else {
            // console.error(`rmspace str 必须是字符串类型，而你的却是 ${str}`);
            return str;
        }
    }


    /**
     * 静态方法 —— 获取字符串中的数字
     * @param {string} str 要匹配的字符串
     * @param {number} [start] 可选，从第几位数字开始获取
     * @param {number} [end] 可选，获取到第几位数字结束
     */
    static getNumber(str, start = 0, end) {
        str += "";

        if (!str) throw Error(`getNumber str 未传值！`);

        if (/^\d+$/.test(start) === false) throw Error(`getNumber start 的值必须是数字`);

        if (start > str.length) throw Error(`getNumber start 的值超过了字符串的长度，str的长度为 ${str.length}，而你的 start 却是 ${start}`);

        let num = str.match(/\d+/img);

        let newStr = num ? num.join("") : "";

        if (end && /^\d+$/.test(end)) {
            return newStr.slice(start, end);
        } else {
            return newStr.slice(start);
        }
    }


    /**
    * 静态方法 —— 获取字符串中的字母
    * @param {string} str 要匹配的字符串
    * @param {number} [start] 可选，从第几位数字开始获取
    * @param {number} [end] 可选，获取到第几位数字结束
    */
    static getLetter(str, start = 0, end) {
        str += "";

        if (!str) throw Error(`getNumber str 未传值！`);

        if (/^\d+$/.test(start) === false) throw Error(`getNumber start 的值必须是数字`);

        if (start > str.length) throw Error(`getNumber start 的值超过了字符串的长度，str的长度为 ${str.length}，而你的 start 却是 ${start}`);

        let ltr = str.match(/[a-z]+/img);

        let newStr = ltr ? ltr.join("") : "";

        if (end && /^\d+$/.test(end)) {
            return newStr.slice(start, end);
        } else {
            return newStr.slice(start);
        }
    }


    /**
     * 静态方法 —— 获取字符串中的中文
     * @param {string} str 要匹配的字符串
     * @param {number} [start] 可选，从第几位数字开始获取
     * @param {number} [end] 可选，获取到第几位数字结束
     */
    static getChWord(str, start = 0, end) {
        str += "";

        if (!str) throw Error(`getNumber str 未传值！`);

        if (/^\d+$/.test(start) === false) throw Error(`getNumber start 的值必须是数字`);

        if (start > str.length) throw Error(`getNumber start 的值超过了字符串的长度，str的长度为 ${str.length}，而你的 start 却是 ${start}`);

        let wd = str.match(/[\u4e00-\u9fa5]+/img);

        let newStr = wd ? wd.join("") : "";

        if (end && /^\d+$/.test(end)) {
            return newStr.slice(start, end);
        } else {
            return newStr.slice(start);
        }
    }


}


module.exports = DataTest