(function () {
    var m_work_as_worker = false;
    try {
        window; // 这句必须有，为了判断，是否在新线程中工作
    } catch (e) {
        m_work_as_worker = true;
        window = this;
        importScripts("reconnecting-websocket.js");
        importScripts("md5.min.js");
        window.$ = {
            isFunction: function (a) {
                return "function" === typeof (a);
            },
            now: function () {
                return new Date().getTime();
            },
        };
    }

    var TYPE = {};
    TYPE.NEW_MASK = 0x80; // 新协议 最高位给1
    TYPE.TYPE_MASK = 0x7F; // 类型有效位，127种

    TYPE.FrameType_POS = 0x01;
    TYPE.FrameType_Update = 0x02; // 新协议 数据变化
    TYPE.FrameType_Alarm = 0x03;
    TYPE.FrameType_Volt = 0x05;
    TYPE.FrameType_DIS = 0x06;
    TYPE.FrameType_BaseStat = 0x07;
    TYPE.FrameType_TagAppend = 0x08;        //push协议，原始心率值
    TYPE.FrameType_HeartRate_study = 0x55;  //private协议，经过学习的心率推送
    TYPE.FrameType_AlarmExt = 0x09;
    TYPE.FrameType_EeCfg = 0x12;
    TYPE.FrameType_Error = 0x19;
    TYPE.FrameType_IOStateExt = 0x21;
    TYPE.FrameType_PersonSI = 0x31;
    TYPE.FrameType_TagOffline = 0x32;
    TYPE.FrameType_AreaInfo = 0x33;
    TYPE.FrameType_POS_RSSI = 0x8F;
    TYPE.FrameType_GEO = 0x34; //经纬度
    TYPE.FrameType_GlobleGraphicPos = 0x35;//全局
    TYPE.FrameType_SIGN = 0x57; //健康数据推送 心率血氧体温
    TYPE.FrameType_NEW_POS = 0x41; // 新协议 相对坐标
    TYPE.FrameType_NEW_GEO = 0x44; // 新协议 经纬度
    TYPE.FrameType_NEW_GlobleGraphicPos = 0x45; // 新协议 全局

    var account_info = {
        username: 'admin',
        password: 'localsense',
    };

    var webSocketOptions = {
        reconnectInterval: 1000, //重连延迟时间
        reconnectDecay: 1.5, //重连延时增长率
        timeoutInterval: 2000, //一次连接等待时间
        maxReconnectInterval: 5000 //重连最大延迟时间
    };

    if (!window.LOCALSENSE) LOCALSENSE = {};
    
    LOCALSENSE.WEBSOCKET_API = new function () {

        var this_obj = this;
        var ws1 = null,
            ws2 = null,
            ws3 = null;

        var m_callbacks = {};

        var g_is_tag_off = {};
        var g_posdata = {};
        var g_base_state = {};

        var tag64Checked = true;//是否64位

        this.PosOutMode = {
            "1": "XY", //只输出平面坐标
            "2": "GEO",//只输出gps坐标
            "3": "GLOBAL",//只输出全局坐标
            "4": "XY_GEO", //同时输出xy平面坐标和GPS坐标
            "5": "XY_GLOBAL",//同时输出xy平面坐标和全局坐标
            "6": "GEO_GLOBAL"  //同时输出gps坐标和全局坐标
        };
        var pos_out_type = this.PosOutMode["1"]; //默认输出位置数据模式为: 只平面坐标

        this_obj.setTag64CheckedFlag = function (v) {
            tag64Checked = v;
        }

        this_obj.setPosOutType = function (v) {
            pos_out_type = v;
        }


        this_obj.ClearBuffer = function () {
            g_is_tag_off = {};
            g_posdata = {};
            g_base_state = {};
        };

        this_obj.CB_TYPE = {
            TAG_POWER: 'onRecvTagPower',
            TAG_POWER_BIN: 'onRecvTagPowerBin',
            TAG_POS: 'onRecvTagPos',
            TAG_POS_BIN: 'onRecvTagPosBin',
            GAO_JING: 'onRecvGaojing',
            GAO_JING_BIN: 'onRecvGaojingBin',
            AREA_INFO: 'onRecvAreaInfo',
            AREA_INFO_BIN: 'onRecvAreaInfoBin',
            MOD_DATA: 'onRecvModifyData',
            MOD_DATA_BIN: 'onRecvModfiyDataBin',
            ROLLCALL_DATA: 'onRecvDmData',
            ROLLCALL_DATA_BIN: 'onRecvDmDataBin',
            HEART_INFO: 'onRecvHeartInfo',
            SIGN_INFO: 'onRecvSignInfo',
            HEART_INFO_BIN: 'onRecvHeartInfoBin',
            HEART_INFO_STUDY: 'onRecvHeartStudyInfo',
            PERSON_INFO: 'onRecvPersonInfo',
            PERSON_INFO_BIN: 'onRecvPersonInfoBin',
            DISTANCE_DATA: 'onRecvDistanceData',
            BASE_ST_DATA: 'onRecvBaseStData',
            BASE_ST_DATA_BIN: 'onRecvBaseStDataBin',
            TAG_OFF_LINE: 'onRecvTagOffLine',
            Send_Int8v: 'onSendInt8v',
            WS_SWITCH_RESULT: 'onRecvWebScoketSwitchBack',
            WS_SWITCH_CLICK: 'onRecvClickSwitchBack',
            WS_VIDEO_CHANGE: 'onRecvVideoChange',
            // 视频联动打开指令回调函数
            WS_VIDEO_SEND: 'onSendVideoRequest',
            // 视频联动关闭指令回调函数
            WS_VIDEO_CLOSE: 'onSendVideoClose',
            // 临时撤防指令
            WS_DRAW_UPDATE: 'onSendDrawRequest',
            // 标签蜂鸣指令
            WS_TAG_SHAKE: 'onSendTagShakeRequest',
            ON_OPEN: 'onOpen',
            ON_CLOSE: 'onClose',
            ON_WS_CLOSE: 'onWsClose',
            ON_ERROR: 'onError',
            ON_WS_ERROR: 'onWsError'
        };

        (function () {
            for (var key in this_obj.CB_TYPE) {
                var val = this_obj.CB_TYPE[key];
                this_obj[val] = null;
            }
        }());

        this_obj.SetAccount = function (username, password, salt_en_val) {
            account_info.username = username;
            if (salt_en_val == "") {
                account_info.password = md5(password);
            } else {
                account_info.password = md5(md5(password) + salt_en_val);
            }
        };

        this_obj.RegisterCallbackFunc = function (type, callback) {
            m_callbacks[type] = callback;
        };

        function CallbackRegisterFunc(type) {
            var args = [];
            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            var on_func = this_obj[type];
            if ($.isFunction(on_func)) {
                try {
                    on_func.apply(null, args);
                } catch (e) {
                    console.error(e);
                }
            }
            if (type in m_callbacks) {
                var func = m_callbacks[type];
                try {
                    func.apply(null, args);
                } catch (e) {
                    console.error(e);
                }
            }

            if (m_work_as_worker) {
                var obj = [type, args];
                var str = JSON.stringify(obj);
                postMessage(str);
            }
        };

        function getAndsendGrpAccess(ws) {

            var username = account_info.username;
            var pwd = account_info.password;

            /**
             * 用户名: admin → 61 64 6D 69 6E
             * 密码:  47bce5c74f589f4867dbd57e9ca9f808
             * 1. 帧头 固定值2B 0xcc5f
             * 2. 帧类型 固定值1B 0x27
             * 3. 用户名长度 4B 0x00000005
             * 4. 用户名字符 NB admin
             * 5. 用户密码长度 4B 0x0000000A
             * 6. 用户密码字符 NB localsense
             * 7. CRC校验 2B
             * 8. 帧尾 2B
             */

            var buffer = new ArrayBuffer(256); //预定义
            var int8view = new Uint8Array(buffer);
            //var str_16 = "0x";//为了后面做CRC16校验，将所有数据收集组成16进制数据字符串
            var str_2 = ""; //为了后面做CRC16校验，将所有数据收集组成2进制数据字符串
            int8view[0] = 0xCC;
            int8view[1] = 0x5F;
            int8view[2] = 0x27;
            //str_16+="CC5F27";
            str_2 += hexto0b("CC5F27");
            //处理用户名长度
            var len = username.length;
            var len2hex = len.toString(16);
            var len2hex_str_len = String(len2hex).length; //姓名所得16进制字符串长度
            var len8 = Math.floor((8 - len2hex_str_len) / 2); //需要补0的长度
            for (var i = 3; i < 3 + len8; i++) {
                int8view[i] = 0;
                //str_16+="00";
                str_2 += "00000000";
            }
            //存入用户名长度  从3+len8
            var name_16_len = Math.ceil(len2hex_str_len / 2); //姓名长度标识位  需要设置的次数
            if (len2hex_str_len / 2 % 1 === 0) { //类似0x1C 0x21CB等
                for (var i = 0; i < name_16_len; i++) {
                    int8view[3 + len8 + i] = len2hex.substring(i * 2, 2 + i * 2);
                    //str_16+=""+len2hex.substring(i*2,2+i*2);
                    str_2 += hexto0b(len2hex.substring(i * 2, 2 + i * 2));
                }
            } else { //类似0x01C 0x021CB
                for (var i = 0; i < name_16_len; i++) {
                    if (i == 0) {
                        int8view[3 + len8 + i] = "0" + len2hex.substring(i * 2, 1 + i * 2);
                        //str_16+="0"+len2hex.substring(i*2,1+i*2);
                        str_2 += ("0000" + hexto0b(len2hex.substring(i * 2, 1 + i * 2)));
                    } else {
                        int8view[3 + len8 + i] = len2hex.substring(i * 2, 2 + i * 2);
                        //str_16+=""+len2hex.substring(i*2,2+i*2);
                        str_2 += hexto0b(len2hex.substring(i * 2, 2 + i * 2));
                    }
                }
            }
            //处理用户名
            var name16_str = strToHexCharCode(username);
            for (var i = 0; i < username.length; i++) {
                int8view[7 + i] = "0x" + name16_str.substring(2 + i * 2, 4 + i * 2); //+2是为了避开开头的0x
                //str_16+=""+name16_str.substring(2+i*2,4+i*2);
                str_2 += hexto0b(name16_str.substring(2 + i * 2, 4 + i * 2));
            }
            //处理密码长度标识
            var plen = pwd.length;
            var plen2hex = plen.toString(16);
            var plen2hex_str_len = String(plen2hex).length; //密码所得16进制字符串长度
            var plen8 = Math.floor((8 - plen2hex_str_len) / 2); //需要补0的长度
            var pwd_len_0_start = 6 + username.length + 1; //密码长度标识位开始索引
            //密码长度标识补零位置
            for (var i = 0; i < plen8; i++) {
                int8view[i + pwd_len_0_start] = 0;
                //str_16+="00";
                str_2 += "00000000";
            }
            //密码长度 具体值设置 从pwd_len_0_start+plen8开始
            var p_16_len = Math.ceil(plen2hex_str_len / 2); //密码长度标识位  需要设置的次数
            var pwd_len_start = pwd_len_0_start + plen8;
            if (plen2hex_str_len / 2 % 1 === 0) { //类似0x1C 0x21CB等
                for (var i = 0; i < p_16_len; i++) {
                    int8view[pwd_len_start + i] = plen2hex.substring(i * 2, 2 + i * 2);
                    //str_16+=""+plen2hex.substring(i*2,2+i*2);
                    str_2 += hexto0b(plen2hex.substring(i * 2, 2 + i * 2));
                }
            } else { //类似0x01C 0x021CB
                for (var i = 0; i < p_16_len; i++) {
                    if (i == 0) {
                        int8view[pwd_len_start + i] = "0" + plen2hex.substring(i * 2, 1 + i * 2);
                        //str_16+="0"+plen2hex.substring(i*2,1+i*2);
                        str_2 += hexto0b(plen2hex.substring(i * 2, 2 + i * 2));
                    } else {
                        int8view[pwd_len_start + i] = plen2hex.substring(i * 2, 2 + i * 2);
                        //str_16+=""+plen2hex.substring(i*2,2+i*2);
                        str_2 += hexto0b(plen2hex.substring(i * 2, 2 + i * 2));
                    }
                }
            }
            //处理密码
            var pwd16_str = strToHexCharCode(pwd);
            var pwd_start = pwd_len_start + p_16_len;
            for (var i = 0; i < pwd.length; i++) {
                int8view[pwd_start + i] = "0x" + pwd16_str.substring(2 + i * 2, 4 + i * 2); //+2是为了避开开头的0x
                //str_16+=""+pwd16_str.substring(2+i*2,4+i*2);
                str_2 += hexto0b(pwd16_str.substring(2 + i * 2, 4 + i * 2));
            }
            /**
              *CRC校验
              *0. 得到原始十六进制发送数据
              *1. 十六进制转二进制 parseInt(info,16).toString(2) 得到原始发送数据C(X) 
              *2. CRC16 
              *		CRC-16 x16+x15+x2+18005IBM SDLC
                    CRC16-CCITT  x16+x12+x5+11021ISO HDLC, ITU X.25, V.34/V.41/V.42, PPP-FCS
                    常用: CRC-16
              */
            //var str_2 = parseInt(str_16,16).toString(2);//C(X)原始报文

            var crc_16 = "11000000000000011";
            var crc_r = 16; //16位校验位置
            var crc_mod = get_high_1_mod(str_2, crc_16); //CRC余数
            while (parseInt(crc_mod, 2) > parseInt(crc_16, 2)) {
                crc_mod = get_high_1_mod(crc_mod, crc_16);
            }
            var sendCRCinfo = ""; //经过crc校验过的信息  二进制字符串
            for (i = 0; i < crc_r - crc_mod.length; i++) { //补零
                sendCRCinfo += "0";
            }
            sendCRCinfo = str_2 + (Array(16).join("0") + crc_mod).slice(-16); //将CRC校验码存放在低位

            //帧尾 固定值 0xAABB
            var sendCRCinfo_16 = "";
            sendCRCinfo_16 = btohex(sendCRCinfo);

            /**
             * 将用CRC16处理过的十六进制的字符串,按照Uint8Array来处理
             */
            var sendCRCinfo_16_len = sendCRCinfo_16.length / 2 + 2; //加2字节 帧尾
            var buf = new ArrayBuffer(sendCRCinfo_16_len);

            var int8v = new Uint8Array(buf); //最终发送数据
            for (var i = 0; i < sendCRCinfo_16_len - 2; i++) {
                int8v[i] = "0x" + sendCRCinfo_16.substring(i * 2, (i + 1) * 2);
            }
            int8v[sendCRCinfo_16_len - 2] = "0xAA";
            int8v[sendCRCinfo_16_len - 1] = "0xBB";

            var waitWs1 = -1;
            waitWs1 = setInterval(function () {
                if (ws != undefined && ws.readyState == 1) {
                    clearInterval(waitWs1);
                    ws.send(int8v.buffer);
                    CallbackRegisterFunc(this_obj.CB_TYPE.Send_Int8v, int8v);
                }
            }, 100);


        };

        this_obj.RejectControlInfo = function (callback) {
            if (ws3) {
                ws3.onclose = function (event) {
                    if ($.isFunction(callback)) {
                        callback(event);
                    }
                };
                ws3.close();
            }
        };

        this_obj.RequireControlInfo = function (url, ws = 'ws') {
            try {
                //setInterval('reconnectWs3()',5000);

                ws3 = new ReconnectingWebSocket(ws + "://" + url, ["localSense-Json"], webSocketOptions);
                ws3.onopen = function (event) {
                    getAndsendGrpAccess(ws3); //认证一次数据权限
                    CallbackRegisterFunc(this_obj.CB_TYPE.ON_OPEN, "websocket已建立连接");
                };
                ws3.onmessage = function (event) {
                    //处理数据,此处需要将event传回来的data做解析。data中只需要数据,不要带那个什么anchors的头
                    var evtdata = event.data;
                    if (!evtdata) {
                        return;
                    }
                    if (evtdata.length) {
                        evtdata = JSON.parse(evtdata);
                    }
                    //判断是否是无陪同告警总开关状态
                    if (evtdata && evtdata.localsense_conf_response && evtdata.localsense_conf_response.conf_type == "noaccompany") {
                        handleSwitchCallBack('handleNoaccompanySwitch', evtdata.localsense_conf_response.conf_value);
                    }
                    //判断是否是提押监控告警总开关状态
                    if (evtdata && evtdata.localsense_conf_response && evtdata.localsense_conf_response.conf_type == "arraign") {
                        handleSwitchCallBack('handleArraignSwitch', evtdata.localsense_conf_response.conf_value);
                    }
                    //判断是否是区域超员告警总开关状态
                    if (evtdata && evtdata.localsense_conf_response && evtdata.localsense_conf_response.conf_type == "overman") {
                        handleSwitchCallBack('handleOvermanSwitch', evtdata.localsense_conf_response.conf_value);
                    }
                    //判断点名任务管理总开关状态
                    if (evtdata && evtdata.localsense_conf_response && evtdata.localsense_conf_response.conf_type == "rollcall") {
                        handleSwitchCallBack('handleRollCallSwitch', evtdata.localsense_conf_response.conf_value);
                    }
                    //判断电子围栏总开关状态
                    if (evtdata && evtdata.localsense_conf_response && evtdata.localsense_conf_response.conf_type == "eefence") {
                        handleSwitchCallBack('handleAlarmCallSwitch', evtdata.localsense_conf_response.conf_value);
                    }
                    //判断是否是视频联动的返回参数
                    if (evtdata && evtdata.localsense_video_response) {
                        handleVideoInfoChange(evtdata.localsense_video_response);
                    }

                    /* 硬件配置 不要先
                    var data = [];
                    if (evtdata && evtdata.localsense_anchors) {
                        data = evtdata.localsense_anchors;
                        handleYingjianInfo(data);
                    } else if (!evtdata && evtdata.localsense_singleanchor) {
                        handleSingleYingjianInfo(evtdata.localsense_singleanchor);
                    } else if (!evtdata && evtdata.localsense_anchorreset) {
                        if (evtdata.localsense_anchorreset == "OK") {
                            $scopeyingjian.result = "配置成功";
                            setTimeout(function() {
                                $scopeyingjian.result = "";
                            }, 5000);
                        } else {
                            $scopeyingjian.result = "配置失败";
                        }
                    } else if (!evtdata && evtdata.localsense_responsebackup) {
                        if (evtdata.localsense_responsebackup == "OK") {
                            $scopeyingjian.result = "恢复出厂设置成功";
                            setTimeout(function() {
                                $scopeyingjian.result = "";
                            }, 1000);
                        } else {
                            $scopeyingjian.result = "恢复出厂设置失败";
                        }
                    }
                    */
                };
                ws3.onclose = function (event) {
                    CallbackRegisterFunc(this_obj.CB_TYPE.ON_CLOSE, "websocket已关闭连接");
                };
                ws3.onerror = function (event) {

                    CallbackRegisterFunc(this_obj.CB_TYPE.ON_ERROR, event);
                };
            } catch (ex) {
                //alert(ex.message);
            }
        };

        this_obj.RejectBasicInfo = function (callback) {
            if (ws1) {
                ws1.onclose = function (event) {
                    if ($.isFunction(callback)) {
                        callback(event);
                    }
                };
                ws1.close();
            }
        };

        //对外：获取基本信息:位置+电量
        this_obj.RequireBasicInfo = function (url, ws = "ws") {
            try {
                ws1 = new ReconnectingWebSocket(ws + "://" + url, ["localSensePush-protocol"], webSocketOptions);
                ws1.onopen = function (event) {
                    getAndsendGrpAccess(ws1); //认证一次数据权限
                    CallbackRegisterFunc(this_obj.CB_TYPE.ON_OPEN, "websocket已建立连接");
                };
                ws1.onmessage = function (event) {
                    if (event.data instanceof Blob) {
                        var reader = new FileReader();
                        reader.readAsArrayBuffer(event.data);
                        reader.onload = function (evt) {
                            if (evt.target.readyState == FileReader.DONE) {
                                var msgtype_s = 0;
                                var x = new Uint8Array(evt.target.result);
                                var saveX = x;
                                if (x[0] == 0xCC && x[1] == 0x5F) {
                                    msgtype_s = x[2];
                                }

                                var x_data = x.subarray(3);

                                var msgtype = msgtype_s & TYPE.TYPE_MASK;
                                var b_new = (msgtype_s & TYPE.NEW_MASK) == TYPE.NEW_MASK;
                                if (msgtype == TYPE.FrameType_POS || msgtype == TYPE.FrameType_NEW_POS) {
                                    if (pos_out_type == this_obj.PosOutMode["1"] || pos_out_type == this_obj.PosOutMode["4"] || pos_out_type == this_obj.PosOutMode["5"]) {
                                        var isGeo = false;
                                        var isGloble = false;
                                        CallbackRegisterFunc(this_obj.CB_TYPE.TAG_POS_BIN, saveX);
                                        handlePosData(x_data, b_new, isGeo, isGloble, msgtype == TYPE.FrameType_NEW_POS);
                                    }
                                } else if (msgtype_s == TYPE.FrameType_POS_RSSI) {
                                    //handlePosDataRSSI(x_data, true, 64);//固定标签id为8字节的
                                } else if (msgtype == TYPE.FrameType_Volt) {
                                    // 电量信息不处理，已经在位置包里包含
                                    CallbackRegisterFunc(this_obj.CB_TYPE.TAG_POWER_BIN, saveX);
                                    handleTagPow(x_data, b_new);
                                } else if (msgtype == TYPE.FrameType_AlarmExt) {
                                    CallbackRegisterFunc(this_obj.CB_TYPE.PERSON_INFO_BIN, saveX);
                                    handleAlarmInfoExt2(x_data, b_new);
                                } else if (msgtype == TYPE.FrameType_AreaInfo) {
                                    CallbackRegisterFunc(this_obj.CB_TYPE.AREA_INFO_BIN, saveX);
                                    handleAreaInfoExt2(x_data, b_new);
                                } else if (msgtype == TYPE.FrameType_IOStateExt) {
                                    CallbackRegisterFunc(this_obj.CB_TYPE.ROLLCALL_DATA_BIN, saveX);
                                    handleDmData(x_data, b_new);
                                } else if (msgtype == TYPE.FrameType_Alarm) {
                                    CallbackRegisterFunc(this_obj.CB_TYPE.GAO_JING_BIN, saveX);
                                    handleAlarmInfo(x_data, b_new);
                                } else if (msgtype == TYPE.FrameType_Update) {
                                    handleModifyData(x_data);
                                } else if (msgtype == TYPE.FrameType_TagAppend) {
                                    CallbackRegisterFunc(this_obj.CB_TYPE.HEART_INFO_BIN, saveX);
                                    handleAppendInfo(x_data, b_new);
                                } else if (msgtype == TYPE.FrameType_SIGN) {
                                    handleSignData(x_data, b_new);
                                } else if (msgtype == TYPE.FrameType_PersonSI) {
                                    CallbackRegisterFunc(this_obj.CB_TYPE.PERSON_INFO_BIN, saveX);
                                    handlePersonInfo(x_data, b_new);
                                } else if (msgtype == TYPE.FrameType_Error) {
                                    handleErrorInfo(x_data, b_new);
                                } else if (msgtype == TYPE.FrameType_TagOffline) {
                                    handleOffTagInfo(x_data, b_new);
                                } else if (msgtype == TYPE.FrameType_BaseStat) {
                                    CallbackRegisterFunc(this_obj.CB_TYPE.BASE_ST_DATA_BIN, saveX);
                                    handleBaseStData(x_data, b_new);
                                } else if (msgtype == TYPE.FrameType_GlobleGraphicPos || msgtype == TYPE.FrameType_NEW_GlobleGraphicPos) {
                                    if (pos_out_type == this_obj.PosOutMode["3"] || pos_out_type == this_obj.PosOutMode["5"] || pos_out_type == this_obj.PosOutMode["6"]) {//只输出global模式
                                        CallbackRegisterFunc(this_obj.CB_TYPE.TAG_POS_BIN, saveX);
                                        var isGeo = false;
                                        var isGlobal = true;
                                        handlePosData(x_data, b_new, isGeo, isGlobal, msgtype == TYPE.FrameType_NEW_GlobleGraphicPos);
                                    }
                                } else if (msgtype == TYPE.FrameType_GEO || msgtype == TYPE.FrameType_NEW_GEO) {
                                    if (pos_out_type == this_obj.PosOutMode["2"] || pos_out_type == this_obj.PosOutMode["4"] || pos_out_type == this_obj.PosOutMode["6"]) {//只输出geo模式
                                        CallbackRegisterFunc(this_obj.CB_TYPE.TAG_POS_BIN, saveX);
                                        var isGeo = true;
                                        var isGlobal = false;
                                        handlePosData(x_data, b_new, isGeo, isGlobal, msgtype == TYPE.FrameType_NEW_GEO);
                                    }
                                }
                                else {
                                    // 硬件消息，先不处理
                                    //handleYingjianInfo(x_data, b_new);
                                }
                            }
                        };
                    }
                };
                ws1.onclose = function (event) {
                    CallbackRegisterFunc(this_obj.CB_TYPE.ON_CLOSE, "websocket已关闭连接");
                };
                ws1.onerror = function (event) {
                    CallbackRegisterFunc(this_obj.CB_TYPE.ON_ERROR, "websocket已断开连接");
                };
            } catch (ex) {
                //alert(ex.message);
            }
        };

        // 字节计算
        function Byte_Calc(array_data, byte_num, offset) {
            /**
             * array_data 字节数组
             * byte_num 当前字段的字节数
             * offset 当前偏移值
             * 
             * **/
            var base = 0;
            var num_flag = byte_num;
            for (var i = 0; i < byte_num; i++) {
                base += (array_data[offset + i] * Math.pow(2, 8 * (num_flag - 1)));
                num_flag--;
            }
            return base
        }

        function handleOffTagInfo(array_data, b_new) {
            var tagnum = array_data[0] * 256 + array_data[1];
            if (tagnum < 1) {
                return;
            }
            g_is_tag_off = {};

            var offset = 2;
            for (var i = 0; i < tagnum; i++) {
                var off_tagid = 0;
                if (b_new) {
                    if (tag64Checked) {
                        off_tagid = Byte_Calc(array_data, 8, offset);
                        offset += 8;
                    } else {
                        off_tagid = Byte_Calc(array_data, 4, offset);
                        offset += 4;
                    }

                } else {
                    off_tagid = Byte_Calc(array_data, 2, offset);
                    offset += 2;
                }
                g_is_tag_off[off_tagid] = true;
            }

            CallbackRegisterFunc(this_obj.CB_TYPE.TAG_OFF_LINE, g_is_tag_off);
        }

        function handlePosDataRSSI(array_data, b_new, bit) {
            var tagnum = array_data[0];
            if (tagnum < 1) {
                return;
            }
            var offset = 1;
            var timenow = $.now();
            for (var i = 0; i < tagnum; i++) {
                var pos = {};
                if (b_new) {
                    if (bit == 32) {
                        pos.id = Byte_Calc(array_data, 4, offset);
                        offset += 4;
                    } else {
                        pos.id = Byte_Calc(array_data, 8, offset);
                        offset += 8;
                    }
                } else {
                    pos.id = array_data[offset] * 256 + array_data[offset + 1];
                    offset += 2;
                }
                pos.x = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
                if ((array_data[offset] & 0x80) == 0x80) {
                    pos.x = -(0xffffffff - pos.x + 1);
                }
                offset += 4;
                pos.y = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
                if ((array_data[offset] & 0x80) == 0x80) {
                    pos.y = -(0xffffffff - pos.y + 1);
                }
                offset += 4;
                pos.z = array_data[offset] * 256 + array_data[offset + 1];
                if ((array_data[offset] & 0x80) == 0x80) {
                    pos.z = -(0xffff - pos.z + 1);
                }
                offset += 2;
                pos.regid = array_data[offset] * 256 + array_data[offset + 1];
                offset += 2;//地图id 2字节
                pos.timestamp = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
                offset += 4;

                pos.floor = array_data[offset];//楼层编号
                offset += 1;

                pos.reserverd = array_data[offset];//预留
                offset += 1;

                pos.added_len = array_data[offset];//附加信息长度
                offset += 1;

                var added = [];//附加信息
                var len_1_beacon = 21;//单个附加信息beacon的长度为21字节
                for (var tt = 0; tt < pos.added_len / 21; tt++) {
                    var add = {};
                    add.UUID = Byte_Calc(array_data, 16, offset);
                    offset += 16;
                    add.Major = Byte_Calc(array_data, 2, offset);
                    offset += 2;
                    add.Minor = Byte_Calc(array_data, 2, offset);
                    offset += 2;
                    add.RSSI = array_data[offset];
                    if ((array_data[offset] & 0x80) == 0x80) {//RSSI为有符号
                        add.RSSI = -(0xff - add.RSSI + 1);
                    }
                    offset += 1;

                    added[tt] = add;
                }

                pos.added = added;//RSSI解析

                pos.timestamp_web = timenow; // 用来老化数据

                g_posdata[pos.id] = pos;

            }
            array_data = null;

            //	CallbackRegisterFunc(this_obj.CB_TYPE.TAG_POS, g_posdata);
            m_callback_adj.PosUpdateNow();
        }

        function handleTagPow(array_data, b_new) {
            let data = new Object
            var tagnum = array_data[0];
            if (tagnum < 1) {
                return;
            }
            var offset = 1;

            for (var i = 0; i < tagnum; i++) {
                var tag = {};
                if (b_new) {
                    if (tag64Checked) {
                        tag.tagid = Byte_Calc(array_data, 8, offset);
                        offset += 8;
                    } else {
                        tag.tagid = Byte_Calc(array_data, 4, offset);
                        offset += 4;
                    }

                } else {
                    tag.tagid = array_data[offset] * 256 + array_data[offset + 1];
                    offset += 2;
                }

                tag.cap = array_data[offset];
                offset += 1;
                tag.bcharge = array_data[offset];
                offset += 1;
                data[tag.tagid] = tag

            }
            CallbackRegisterFunc(this_obj.CB_TYPE.TAG_POWER, data);
        }

        function handlePosData(array_data, b_new, isGeo, isGlobal, isNew) {
            var tagnum = array_data[0];
            if (tagnum < 1) {
                return;
            }
            g_posdata = {};
            var offset = 1;
            var timenow = $.now();
            for (var i = 0; i < tagnum; i++) {
                var pos = {};
                pos.isGlobalGraphicCoord = isGlobal || false;
                pos.isGeoGraphicCoord = isGeo || false;
                if (b_new) {
                    if (tag64Checked) {
                        pos.id = Byte_Calc(array_data, 8, offset);
                        offset += 8;
                    } else if (isGeo) {//uwb gps坐标tagid固定4字节
                        pos.id = Byte_Calc(array_data, 4, offset);
                        offset += 4;
                    } else {
                        pos.id = Byte_Calc(array_data, 4, offset);
                        offset += 4;
                    }

                } else {
                    pos.id = array_data[offset] * 256 + array_data[offset + 1];
                    offset += 2;
                }
                pos.x = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];

                if ((array_data[offset] & 0x80) == 0x80) {
                    pos.x = -(0xffffffff - pos.x + 1);
                }
                if (undefined !== isGeo && isGeo == true) {//将xyz各自除以10000000.0
                    pos.x = pos.x / 10000000.0;
                } else {
                    pos.x = pos.x / 100;
                }
                offset += 4;

                pos.y = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];

                if ((array_data[offset] & 0x80) == 0x80) {
                    pos.y = -(0xffffffff - pos.y + 1);
                }
                if (undefined !== isGeo && isGeo == true) {//将xyz各自除以10000000.0
                    pos.y = pos.y / 10000000.0;
                } else {
                    pos.y = pos.y / 100;
                }
                offset += 4;

                pos.z = array_data[offset] * 256 + array_data[offset + 1];

                if ((array_data[offset] & 0x80) == 0x80) {
                    pos.z = -(0xffff - pos.z + 1);
                }
                if (undefined !== isGeo && isGeo == true) {//将xyz各自除以10000000.0
                    pos.z = pos.z / 10000000.0;
                } else {
                    pos.z = pos.z / 100;
                }

                offset += 2;

                if (isNew) {
                    pos.regid = array_data[offset] * 256 + array_data[offset + 1];
                    offset += 2;
                } else {
                    pos.regid = array_data[offset];
                    offset += 1;
                }

                pos.cap = array_data[offset];
                offset += 1;
                pos.sleep = (array_data[offset] & 0x10) ? true : false;
                pos.bcharge = (array_data[offset] & 0x01) ? true : false;
                offset += 1;
                if (isNew) {
                    pos.timestamp =
                        array_data[offset] * 256 * 256 * 256 * 256 * 256 * 256 * 256 +
                        array_data[offset + 1] * 256 * 256 * 256 * 256 * 256 * 256 +
                        array_data[offset + 2] * 256 * 256 * 256 * 256 * 256 +
                        array_data[offset + 3] * 256 * 256 * 256 * 256 +
                        array_data[offset + 4] * 256 * 256 * 256 +
                        array_data[offset + 5] * 256 * 256 +
                        array_data[offset + 6] * 256 +
                        array_data[offset + 7];
                    offset += 8;
                } else {
                    pos.timestamp =
                        array_data[offset] * 16777216 +
                        array_data[offset + 1] * 65536 +
                        array_data[offset + 2] * 256 +
                        array_data[offset + 3];
                    offset += 4;
                }

                pos.floor = array_data[offset];
                offset += 1;
                pos.positioningIndication = array_data[offset];
                offset += 1;
                if (isNew) {
                    pos.confidenceLevel = array_data[offset];
                    offset += 1;
                    pos.activityAreaId =
                        array_data[offset] * 256 * 256 * 256 * 256 * 256 +
                        array_data[offset + 1] * 256 * 256 * 256 * 256 +
                        array_data[offset + 2] * 256 * 256 * 256 +
                        array_data[offset + 3] * 256 * 256 +
                        array_data[offset + 4] * 256 +
                        array_data[offset + 5];
                    offset += 6;
                }

                //pos.reserverd = array_data[offset] * 256 + array_data[offset + 1];
                // offset += 2;
                //当前标签的绑定情况+
                //pos.bindmaster = g_scope.tagid2name[pos.id] ? g_scope.tagid2name[pos.id] : pos.id;

                //pos.timestamp_web = timenow; // 用来老化数据
                /* 不再判断动态的休眠
                // 休眠状态处理，只要有移动，强制给 未休眠
                if(pos.id in g_posdata && g_posdata[pos.id].last_x){
                    var pos_last = g_posdata[pos.id];
                    pos.last_x = pos_last.last_x;
                    pos.last_y = pos_last.last_y;
                    pos.last_z = pos_last.last_z;
                    if(pos.last_x != pos.x || pos.last_y != pos.y || pos.last_z != pos.z ){	
                        // 只要有移动，强制给 未休眠
                        pos.last_x = pos.x;
                        pos.last_y = pos.y;
                        pos.last_z = pos.z;
                        pos.sleep = false;
                    }
                }else{// 初始状态
                    pos.last_x = pos.x;
                    pos.last_y = pos.y;
                    pos.last_z = pos.z;
                    pos.sleep = false;
                }
                */
                g_posdata[pos.id] = pos;

            }
            array_data = null;
            data = null;
            CallbackRegisterFunc(this_obj.CB_TYPE.TAG_POS, g_posdata);
        };

        //报警
        function handleAlarmInfo(array_data, b_new) {
            var alarm = new Object;
            var offset = 0;
            alarm.type = array_data[offset]; //0x01 电子围栏报警 0x02表示SOS报警 0x03表示剪断报警 0x04表示消失报警
            offset += 1;
            if (b_new) {
                if (tag64Checked) {
                    alarm.objectId = Byte_Calc(array_data, 8, offset);
                    offset += 8;
                } else {
                    alarm.objectId = Byte_Calc(array_data, 4, offset);
                    offset += 4;
                }
            } else {
                alarm.objectId = Byte_Calc(array_data, 2, offset);
                offset += 2;
            }
            alarm.timestamp = array_data[offset] * 16777216 * 16777216 * 256 + array_data[offset + 1] * 16777216 * 16777216 + array_data[offset + 2] * 16777216 * 65536 + array_data[offset + 3] * 16777216 * 256 + array_data[offset + 4] * 16777216 + array_data[offset + 5] * 65536 + array_data[offset + 6] * 256 + array_data[offset + 7];
            offset += 8;

            alarm.alarm_info = "";
            if (b_new) {
                for (var i = 0; i < 120; i += 2) {
                    var code = array_data[offset] + array_data[offset + 1] * 256;
                    if (code != 0) {
                        alarm.alarm_info += String.fromCharCode(code);
                    }
                    offset += 2;
                }
            } else {
                offset += 120;
            }


            CallbackRegisterFunc(this_obj.CB_TYPE.GAO_JING, alarm);
        };

        function handleAlarmInfoExt(array_data, b_new) {
            var alarm = new Object;
            var offset = 0;
            alarm.type = array_data[offset]; //0x01 电子围栏报警 0x02表示SOS报警 0x03表示剪断报警 0x04表示消失报警
            offset += 1;
            if (b_new) {
                if (tag64Checked) {
                    alarm.objectId = Byte_Calc(array_data, 8, offset);
                    offset += 8;
                } else {
                    alarm.objectId = Byte_Calc(array_data, 4, offset);
                    offset += 4;
                }
            } else {
                alarm.objectId = Byte_Calc(array_data, 2, offset);
                offset += 2;
            }
            alarm.timestamp = array_data[offset] * 16777216 * 16777216 * 256 + array_data[offset + 1] * 16777216 * 16777216 + array_data[offset + 2] * 16777216 * 65536 + array_data[offset + 3] * 16777216 * 256 + array_data[offset + 4] * 16777216 + array_data[offset + 5] * 65536 + array_data[offset + 6] * 256 + array_data[offset + 7];
            offset += 8;

            //offset80 start
            alarm.fence_id = 0;
            for (var i = 0; i < 8; i++) {
                alarm.fence_id += array_data[offset];
                alarm.fence_id *= 256;
                offset += 1;
            };
            alarm.fence_id /= 256;


            alarm.self_xpos = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
            if ((array_data[offset] & 0x80) == 0x80) {
                alarm.self_xpos = -(0xffffffff - alarm.self_xpos + 1);
            }
            offset += 4;

            alarm.self_ypos = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
            if ((array_data[offset] & 0x80) == 0x80) {
                alarm.self_ypos = -(0xffffffff - alarm.self_ypos + 1);
            }
            offset += 4;

            alarm.edge_name = "";
            if (b_new) {
                for (var i = 0; i < 30; i += 2) {
                    var code = array_data[offset] + array_data[offset + 1] * 256;
                    if (code != 0) {
                        alarm.edge_name += String.fromCharCode(code);
                    }
                    offset += 2;
                }
            } else {
                offset += 30;
            }


            alarm.vertex_name = "";
            if (b_new) {
                for (var i = 0; i < 30; i += 2) {
                    var code = array_data[offset] + array_data[offset + 1] * 256;
                    if (code != 0) {
                        alarm.vertex_name += String.fromCharCode(code);
                    }
                    offset += 2;
                }
            } else {
                offset += 30;
            }

            alarm.v_dis = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
            offset += 4;
            //offset80 end
            //offset += 80;


            alarm.id = array_data[offset] * 16777216 * 16777216 * 256 + array_data[offset + 1] * 16777216 * 16777216 + array_data[offset + 2] * 16777216 * 65536 + array_data[offset + 3] * 16777216 * 256 + array_data[offset + 4] * 16777216 + array_data[offset + 5] * 65536 + array_data[offset + 6] * 256 + array_data[offset + 7]; /*if( alarm.type<=4)*/
            //recevGaojing(alarm, $scope);

            CallbackRegisterFunc(this_obj.CB_TYPE.GAO_JING, alarm);
        };

        //区域进出消息
        function handleAreaInfoExt2(array_data, b_new) {
            var area_info = new Object();
            var offset = 0;

            if (tag64Checked) {
                area_info.tag_id = Byte_Calc(array_data, 8, offset);
                offset += 8;
            } else {
                area_info.tag_id = Byte_Calc(array_data, 4, offset);
                offset += 4;
            }


            var tag_name_len = Byte_Calc(array_data, 2, offset);
            offset += 2;

            area_info.tag_name = "";
            if (b_new) {
                for (var i = 0; i < tag_name_len; i += 2) {
                    var code = array_data[offset] + array_data[offset + 1] * 256;
                    if (code != 0) {
                        area_info.tag_name += String.fromCharCode(code);
                    }
                    offset += 2;
                }
            } else {
                offset += tag_name_len;
            }

            area_info.area_id = Byte_Calc(array_data, 8, offset);
            offset += 8;

            var arae_name_len = Byte_Calc(array_data, 2, offset);
            offset += 2;

            area_info.area_name = "";
            if (b_new) {
                for (var j = 0; j < arae_name_len; j += 2) {
                    var code = array_data[offset] + array_data[offset + 1] * 256;
                    if (code != 0) {
                        area_info.area_name += String.fromCharCode(code);
                    }
                    offset += 2;
                }
            } else {
                offset += arae_name_len;
            }

            area_info.map_id = Byte_Calc(array_data, 2, offset);
            offset += 2;

            var map_name_len = Byte_Calc(array_data, 2, offset);
            offset += 2;

            area_info.map_name = "";
            if (b_new) {
                for (var k = 0; k < map_name_len; k += 2) {
                    var code = array_data[offset] + array_data[offset + 1] * 256;
                    if (code != 0) {
                        area_info.map_name += String.fromCharCode(code);
                    }
                    offset += 2;
                }
            } else {
                offset += map_name_len;
            }

            area_info.status = Byte_Calc(array_data, 1, offset);
            offset += 1;

            area_info.timestamp = Byte_Calc(array_data, 8, offset);
            offset += 8;
            CallbackRegisterFunc(this_obj.CB_TYPE.AREA_INFO, area_info);
        }

        function handleAlarmInfoExt2(array_data, b_new) {
            var alarm = new Object;
            var offset = 0;
            alarm.type = array_data[offset]; //0x01 电子围栏报警 0x02表示SOS报警 0x03表示剪断报警 0x04表示消失报警
            offset += 1;
            if (b_new) {
                if (tag64Checked) {
                    alarm.objectId = Byte_Calc(array_data, 8, offset);
                    offset += 8;
                } else {
                    alarm.objectId = Byte_Calc(array_data, 4, offset);
                    offset += 4;
                }
            } else {
                alarm.objectId = Byte_Calc(array_data, 2, offset);
                offset += 2;
            }
            alarm.timestamp = array_data[offset] * 16777216 * 16777216 * 256 + array_data[offset + 1] * 16777216 * 16777216 + array_data[offset + 2] * 16777216 * 65536 + array_data[offset + 3] * 16777216 * 256 + array_data[offset + 4] * 16777216 + array_data[offset + 5] * 65536 + array_data[offset + 6] * 256 + array_data[offset + 7];
            offset += 8;

            //offset80 start
            alarm.fence_id = 0;
            for (var i = 0; i < 8; i++) {
                alarm.fence_id += array_data[offset];
                alarm.fence_id *= 256;
                offset += 1;
            };
            alarm.fence_id /= 256;


            alarm.self_xpos = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
            if ((array_data[offset] & 0x80) == 0x80) {
                alarm.self_xpos = -(0xffffffff - alarm.self_xpos + 1);
            }
            alarm.self_xpos = alarm.self_xpos / 100
            offset += 4;

            alarm.self_ypos = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
            if ((array_data[offset] & 0x80) == 0x80) {
                alarm.self_ypos = -(0xffffffff - alarm.self_ypos + 1);
            }
            alarm.self_ypos = alarm.self_ypos / 100
            offset += 4;

            offset += 30;       //保留字段，30个字节

            alarm.fence_name = "";
            if (b_new) {
                for (var i = 0; i < 34; i += 2) {
                    var code = array_data[offset] + array_data[offset + 1] * 256;
                    if (code != 0) { //code != 0
                        alarm.fence_name += String.fromCharCode(code);
                    }
                    offset += 2;
                }
            } else {
                offset += 34;
            }

            alarm.id = array_data[offset] * 16777216 * 16777216 * 256 + array_data[offset + 1] * 16777216 * 16777216 + array_data[offset + 2] * 16777216 * 65536 + array_data[offset + 3] * 16777216 * 256 + array_data[offset + 4] * 16777216 + array_data[offset + 5] * 65536 + array_data[offset + 6] * 256 + array_data[offset + 7]; /*if( alarm.type<=4)*/

            offset += 8;

            offset += 19;
            alarm.regid = array_data[offset] * 256 + array_data[offset + 1];
            offset += 12;

            let if_content = array_data[offset]; //等于2时表示带了告警消息
            offset += 1;
            if (if_content && if_content == 2) {
                let content_len = array_data[offset] * 256 + array_data[offset + 1];
                offset += 2;
                alarm.content = "";
                for (var i = 0; i < content_len; i += 2) {
                    var code = array_data[offset] + array_data[offset + 1] * 256;
                    if (code != 0) {
                        alarm.content += String.fromCharCode(code);
                    }
                    offset += 2;
                }
                offset += content_len;
            }
            CallbackRegisterFunc(this_obj.CB_TYPE.GAO_JING, alarm);
        };

        function handleModifyData(array_data) {
            var data = new Object();
            var offset = 0;
            data.timestamp = Byte_Calc(array_data, 8, offset);
            offset += 8;
            data.changeType = array_data[offset];
            offset += 1;
            data.changeWayType = array_data[offset];
            offset += 1;

            CallbackRegisterFunc(this_obj.CB_TYPE.MOD_DATA, data);
        };

        /**电子点名统计区域解析**/
        function handleDmData(array_data, b_new) {
            var dianming = new Object;
            var offset = 0;
            dianming.area_frame = array_data[offset] * 256 + array_data[offset + 1];
            offset += 2;
            dianming.area_framenumber = array_data[offset] * 256 + array_data[offset + 1];
            offset += 2;
            dianming.areanumber = array_data[offset++];
            if (dianming.areanumber < 1) {
                return;
            }
            var areanumber_array = [];
            for (var i = 0; i < dianming.areanumber; i++) {
                var areanumber = {};
                areanumber.id = Byte_Calc(array_data, 8, offset);
                offset += 8;

                var area_name_length = array_data[offset++];
                if (area_name_length < 1) {
                    return;
                }

                //区域名称
                areanumber.areaname = "";
                if (b_new) {
                    for (var j = 0; j < area_name_length; j += 2) {
                        var code = array_data[offset] + array_data[offset + 1] * 256;
                        areanumber.areaname += String.fromCharCode(code);
                        offset += 2;
                    }
                } else {
                    offset += area_name_length;
                }

                areanumber.area_tag_number = array_data[offset] * 256 + array_data[offset + 1];
                offset += 2; //到区域标签

                areanumber.area_tag_list = [];
                for (var i_N2 = 0; i_N2 < areanumber.area_tag_number; i_N2++) {
                    var areaTagnum = {};

                    if (tag64Checked) {
                        areaTagnum.id = Byte_Calc(array_data, 8, offset);
                        offset += 8;
                    } else {
                        areaTagnum.id = Byte_Calc(array_data, 4, offset);
                        offset += 4;
                    }

                    var tag_name_length = array_data[offset++];

                    areaTagnum.tag_name = "";
                    if (b_new) {
                        for (var j = 0; j < tag_name_length; j += 2) {
                            var code = array_data[offset] + array_data[offset + 1] * 256;
                            areaTagnum.tag_name += String.fromCharCode(code);
                            offset += 2;
                        }
                    } else {
                        offset += tag_name_length;
                    }

                    var group_name_lens = array_data[offset++];

                    areaTagnum.group_name = "";
                    if (b_new) {
                        for (var j = 0; j < group_name_lens; j += 2) {
                            var code = array_data[offset] + array_data[offset + 1] * 256;
                            areaTagnum.group_name += String.fromCharCode(code);
                            offset += 2;
                        }
                    } else {
                        offset += group_name_lens;
                    }
                    //预留 
                    areaTagnum.state = array_data[offset++];

                    areaTagnum.ontime = array_data[offset] * 16777216 * 16777216 * 256 + array_data[offset + 1] * 16777216 * 16777216 + array_data[offset + 2] * 16777216 * 65536 + array_data[offset + 3] * 16777216 * 256 + array_data[offset + 4] * 16777216 + array_data[offset + 5] * 65536 + array_data[offset + 6] * 256 + array_data[offset + 7];
                    offset += 8;
                    //预留 
                    areaTagnum.offtime = array_data[offset] * 16777216 * 16777216 * 256 + array_data[offset + 1] * 16777216 * 16777216 + array_data[offset + 2] * 16777216 * 65536 + array_data[offset + 3] * 16777216 * 256 + array_data[offset + 4] * 16777216 + array_data[offset + 5] * 65536 + array_data[offset + 6] * 256 + array_data[offset + 7];
                    offset += 8;
                    areaTagnum.timelens = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
                    offset += 4;
                    //预留  
                    areaTagnum.isassociated = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
                    offset += 4;

                    areanumber.area_tag_list.push(areaTagnum);
                }
                //预留字节
                //var obligatetag = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
                //areanumber.obligatetag = obligatetag;
                areanumber_array = areanumber;
            }
            //vote_task_time_obj.setOrReplaceData(areanumber_array);

            CallbackRegisterFunc(this_obj.CB_TYPE.ROLLCALL_DATA, areanumber_array);

        };

        function handleAppendInfo(array_data, b_new) {
            var heartRateDate = {};
            var offset = 0;

            if (b_new) {
                if (tag64Checked) {
                    heartRateDate.tag_id = Byte_Calc(array_data, 8, offset);
                    offset += 8;
                } else {
                    heartRateDate.tag_id = Byte_Calc(array_data, 4, offset);
                    offset += 4;
                }
            } else {
                heartRateDate.tag_id = array_data[offset] * 256 + array_data[offset + 1];
                offset += 2;
            }


            offset += 2;
            let type = array_data[offset];
            heartRateDate.type = type
            if (type == 0xd5) {
                //固定字节为0xD5
                offset += 1;
                heartRateDate.value = array_data[offset];
                heartRateDate.updatetimestamp =
                    array_data[offset + 1] * 16777216 * 16777216 * 256 +
                    array_data[offset + 2] * 16777216 * 16777216 +
                    array_data[offset + 3] * 16777216 * 65536 +
                    array_data[offset + 4] * 16777216 * 256 +
                    array_data[offset + 5] * 16777216 +
                    array_data[offset + 6] * 65536 +
                    array_data[offset + 7] * 256 +
                    array_data[offset + 8];
            }

            CallbackRegisterFunc(this_obj.CB_TYPE.HEART_INFO, heartRateDate);
        };

        //0xD7帧头，针对心率血样体温进行数据推送 
        function handleSignData(array_data, b_new) {
            var signData = new Object();
            var offset = 0;
            signData.tag_id = Byte_Calc(array_data, 8, offset);
            offset += 8;
            let type = array_data[offset];
            offset += 1
            signData.type = type
            switch (type) {
                case 1: signData.value = Byte_Calc(array_data, 2, offset); break;//心率
                case 2: signData.value = Byte_Calc(array_data, 2, offset); break;//血氧
                case 3: signData.value = Byte_Calc(array_data, 2, offset) / 100; break;//体温
                case 4: signData.value = Byte_Calc(array_data, 2, offset); break;//血压的收缩压
            }
            offset += 2
            signData.other = Byte_Calc(array_data, 2, offset);//type为4时表示血压的舒张压
            offset += 2
            signData.updatetimestamp = Byte_Calc(array_data, 8, offset);

            CallbackRegisterFunc(this_obj.CB_TYPE.SIGN_INFO, signData);
        }

        function handleErrorInfo(array_data, b_new) {
            var error_info = {};
            var offset = 0;

            error_info.error_no = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
            offset += 4;

            error_info.error_len = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
            offset += 4;

            error_info.error_msg = "";

            for (var i = 0; i < error_info.error_len; i += 2) {
                var code = array_data[offset] + array_data[offset + 1] * 256;
                error_info.error_msg += String.fromCharCode(code);
                offset += 2;
            }

            CallbackRegisterFunc(this_obj.CB_TYPE.ERROR_INFO, error_info);
        };

        var person_info = {};

        function handlePersonInfo(array_data, b_new) {
            /**
            * 目前服务端推送和协议不一致
            * 实际推送时，一帧是推送一个地图，当total和num相等时，一轮结束，完成一次所有图层统计
            */

            // 偏移量
            var offset = 0;
            // 总帧
            var total = array_data[offset] * 256 + array_data[offset + 1];
            offset += 2;

            if (total == 1) {
                // 总帧数为1的情况下，每次推送都置空避免旧数据影响
                person_info = {};
            }

            // 当前帧数
            var num = array_data[offset] * 256 + array_data[offset + 1];

            if (num == 1) {
                // 当前帧为1的情况下，清空上次缓存的数据避免重复添加
                person_info = {}
            }

            offset += 2;

            // 标签总数
            var tag_total = array_data[offset] * 256 + array_data[offset + 1];
            person_info.tag_total = tag_total;
            offset += 2;

            // 在线标签数
            var online_num = array_data[offset] * 256 + array_data[offset + 1];
            person_info.tag_online_total = online_num;
            offset += 2;

            if (!person_info.map_infos) {
                person_info.map_infos = {};
            }

            // 当前帧推送的地图数
            var mapNum = array_data[offset];
            offset += 1;

            var map_id = array_data[offset] * 256 + array_data[offset + 1];

            if (person_info.map_infos[map_id]) {
                var map_obj = person_info.map_infos[map_id];
            } else {
                var map_obj = {};
                map_obj.map_name = "";
                map_obj.online_counts = 0;
                map_obj.tags = [];
                map_obj.map_id = map_id;
            }

            offset += 2;

            var map_name_length = array_data[offset];
            offset += 1;

            if (b_new) {
                for (var j = 0; j < map_name_length; j += 2) {
                    var code = array_data[offset] + array_data[offset + 1] * 256;
                    map_obj.map_name += String.fromCharCode(code);
                    offset += 2;
                }
            } else {
                offset += map_name_length;
            }

            var online_counts = array_data[offset] * 256 + array_data[offset + 1];
            map_obj.online_counts += online_counts;
            offset += 2;


            for (var j = 0; j < online_counts; j++) {
                var tag_id = -1;
                if (b_new) {
                    if (tag64Checked) {
                        tag_id = Byte_Calc(array_data, 8, offset);
                        offset += 8;
                    } else {
                        tag_id = Byte_Calc(array_data, 4, offset);
                        offset += 4;
                    }
                } else {
                    tag_id = array_data[offset] * 256 + array_data[offset + 1];
                    offset += 2;
                }

                /*var reserve = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
                offset += 4;*/

                var tag_info = {
                    'tag_id': tag_id,
                    /*'reserve': reserve,*/ //20190129服务端相应去掉预留 yates
                };
                map_obj.tags.push(tag_info);
            }

            offset += 2; //预留2字节

            person_info.map_infos[map_obj.map_id] = map_obj;

            if (num == total) {
                person_info.map_num = Object.keys(person_info.map_infos).length;
                CallbackRegisterFunc(this_obj.CB_TYPE.PERSON_INFO, person_info);
            }
        };

        this_obj.RejectExtraInfo = function (callback) {
            if (ws2) {
                ws2.onclose = function (event) {
                    if ($.isFunction(callback)) {
                        callback(event);
                    }
                };
                ws2.close();
            }
        };

        //对外：获取其它信息:距离+基站状态
        this_obj.RequireExtraInfo = function (url, ws = 'ws') {
            try { /*ws2 = new WebSocket("ws://"+webSocketHostURL+":9001",["localSensePirvate-protocol"]);*/
                ws2 = new ReconnectingWebSocket(ws + "://" + url, ["localSensePrivate-protocol"], webSocketOptions); /*1.4版本*/
                ws2.onopen = function (event) {
                    getAndsendGrpAccess(ws2); //认证一次数据权限
                    CallbackRegisterFunc(this_obj.CB_TYPE.ON_OPEN, "websocket已建立连接");
                };
                ws2.onmessage = function (event) {
                    if (event.data instanceof Blob) {
                        var reader = new FileReader();
                        reader.readAsArrayBuffer(event.data);
                        reader.onload = function (evt) {
                            if (evt.target.readyState == FileReader.DONE) {
                                var msgtype_s = -1;
                                var x = new Uint8Array(evt.target.result);

                                if (x[0] == 0xCC && x[1] == 0x5F) {
                                    msgtype_s = x[2];
                                }

                                var x_data = x.subarray(3);

                                var msgtype = msgtype_s & TYPE.TYPE_MASK;
                                var b_new = (msgtype_s & TYPE.NEW_MASK) == TYPE.NEW_MASK;
                                if (msgtype == TYPE.FrameType_DIS) {
                                    handleDistanceData(x_data, b_new);
                                } else if (msgtype == TYPE.FrameType_HeartRate_study) {       //学习过的心率推送
                                    handleHeartRate(x_data, b_new);
                                } else if (msgtype == TYPE.FrameType_EeCfg) {
                                    handleAlarmSwitch(x_data, b_new);
                                }
                            }
                        };
                    }
                };
                ws2.onclose = function (event) {
                    CallbackRegisterFunc(this_obj.CB_TYPE.ON_CLOSE, "websocket已关闭连接");
                };
                ws2.onerror = function (event) {
                    CallbackRegisterFunc(this_obj.CB_TYPE.ON_ERROR, "websocket已断开连接");
                };
            } catch (ex) {
                //alert(ex.message);
            }
        };

        function handleDistanceData(array_data, b_new) {
            var disData = new Object();
            var offset = 0;

            if (b_new) {
                if (tag64Checked) {
                    disData.tagid = Byte_Calc(array_data, 8, offset);
                    offset += 8;
                } else {
                    disData.tagid = Byte_Calc(array_data, 4, offset);
                    offset += 4;
                }
            } else {
                disData.tagid = Byte_Calc(array_data, 2, offset);
                offset += 2;
            }

            var basenum = array_data[offset];
            if (basenum < 1) {
                return;
            }
            offset += 1;
            var dis_array = new Array(basenum);
            for (var i = 0; i < basenum; i++) {
                var base = new Object();

                if (b_new) {
                    base.id = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
                    offset += 4;
                } else {
                    base.id = array_data[offset] * 256 + array_data[offset + 1];
                    offset += 2;
                }

                base.ranging = array_data[offset] * 256 + array_data[offset + 1];
                offset += 2;

                if (b_new) {
                    base.timestamp = array_data[offset + 1] * 16777216 * 16777216 * 256 + array_data[offset + 1] * 16777216 * 16777216 + array_data[offset + 2] * 16777216 * 65536 + array_data[offset + 3] * 16777216 * 256 + array_data[offset + 4] * 16777216 + array_data[offset + 5] * 65536 + array_data[offset + 6] * 256 + array_data[offset + 7];
                    offset += 8;
                    base.reserve = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
                    offset += 4;
                } else {
                    base.quality = array_data[offset];
                    offset += 1;
                    offset += 1;
                }

                dis_array.push(base);
            }
            disData.dis_array = dis_array;

            CallbackRegisterFunc(this_obj.CB_TYPE.DISTANCE_DATA, disData);
        };

        function handleBaseStData(array_data, b_new) {
            var offset = 0;
            var basenum = array_data[offset];
            if (basenum < 1) {
                return;
            }
            g_base_state = {};
            offset += 1;

            var timenow = $.now();

            for (var i = 0; i < basenum; i++) {
                var base = new Object();

                if (b_new) {
                    base.id = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
                    offset += 4;
                } else {
                    base.id = array_data[offset] * 256 + array_data[offset + 1];
                    offset += 2;
                }

                base.state = array_data[offset];
                offset += 1;
                base.x = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
                if ((array_data[offset] & 0x80) == 0x80) {
                    base.x = -(0xffffffff - base.x + 1);
                }

                offset += 4;
                base.y = array_data[offset] * 16777216 + array_data[offset + 1] * 65536 + array_data[offset + 2] * 256 + array_data[offset + 3];
                if ((array_data[offset] & 0x80) == 0x80) {
                    base.y = -(0xffffffff - base.y + 1);
                }
                offset += 4;
                base.z = array_data[offset] * 256 + array_data[offset + 1];
                offset += 2;
                base.regid = array_data[offset];
                offset += 1;
                base.x = base.x;
                base.y = base.y;

                //base.web_ts = timenow; // 用来老化数据

                g_base_state[base.id] = base;
            }
            CallbackRegisterFunc(this_obj.CB_TYPE.BASE_ST_DATA, g_base_state);
        };

        //学习心率的解析
        function handleHeartRate(array_data, b_new) {
            var heartRateDate = new Object();
            var offset = 0;

            if (!tag64Checked) {
                heartRateDate.tag_id = Byte_Calc(array_data, 4, offset);
                offset += 4;
            } else {
                heartRateDate.tag_id = Byte_Calc(array_data, 8, offset);
                offset += 8;
            }

            heartRateDate.heart = array_data[offset];
            offset += 1;

            heartRateDate.minHeart = array_data[offset];
            offset += 1;

            heartRateDate.maxHeart = array_data[offset];
            offset += 2;

            heartRateDate.updatetimestamp = array_data[offset + 1] * 16777216 * 16777216 * 256 + array_data[offset + 2] * 16777216 * 16777216 + array_data[offset + 3] * 16777216 * 65536 + array_data[offset + 4] * 16777216 * 256 + array_data[offset + 5] * 16777216 + array_data[offset + 6] * 65536 + array_data[offset + 7] * 256 + array_data[offset + 8];

            CallbackRegisterFunc(this_obj.CB_TYPE.HEART_INFO_STUDY, heartRateDate);

        }

        // 各种开关的回调
        function handleSwitchCallBack(func, state) { //回调
            var result = {
                "func": func,
                "args": [state],
            };
            CallbackRegisterFunc(this_obj.CB_TYPE.WS_SWITCH_RESULT, result);
        };

        function handleVideoInfoChange(result) {
            CallbackRegisterFunc(this_obj.CB_TYPE.WS_VIDEO_CHANGE, result);
        }

        //访客告警发送
        this_obj.Send2WS_SendTagConf = function (mess) { //type: pre提前入场out超时未退卡
            var param = {
                "localsense_tagconf": mess
            };
            ws3.send(JSON.stringify(param));
        };

        // 所有按钮状态
        this_obj.Send2WS_RequsetSwitch = function (type, state) {
            var value = state == 1 ? "enable" : "disable";
            var param = {
                "localsense_conf_request": {
                    "conf_type": type,
                    "conf_value": value
                }
            };
            if (ws3 != undefined) {
                if (ws3.readyState == 1) {
                    var sendData = JSON.stringify(param);
                    ws3.send(sendData);
                    CallbackRegisterFunc(this_obj.CB_TYPE.WS_SWITCH_CLICK, param)
                }
                return ws3.readyState;
            } else {
                return 0;
            }
        }

        //区域超员告警总开关启停请求
        this_obj.Send2WS_RequsetSwitchOverman = function (state) {
            var ws_api = window.LOCALSENSE.WEBSOCKET_API;
            ws_api.Send2WS_RequsetSwitchArraign(state);

            var value = state == 1 ? "enable" : "disable";
            var param = {
                "localsense_conf_request": {
                    "conf_type": "overman",
                    "conf_value": value
                }
            };

            if (ws3 != undefined) {
                if (ws3.readyState == 1) {
                    ws3.send(JSON.stringify(param));
                }
                return ws3.readyState;
            } else {
                return 0;
            }
        };

        this_obj.Send2WS_RequsetVideoOpen = function (tagid) {
            if (ws3) {
                if (ws3.readyState == 1) {
                    var param = {
                        "localsense_video_request": {
                            "tagid": tagid,
                            "track": "true"
                        }
                    };
                    ws3.send(JSON.stringify(param));
                    CallbackRegisterFunc(this_obj.CB_TYPE.WS_VIDEO_SEND, JSON.stringify(param));
                }
            }
        };

        //摄像头关闭请求
        this_obj.Send2WS_RequsetVideoClose = function (tagid) {
            if (ws3) {
                if (ws3.readyState == 1) {
                    var param = {
                        "localsense_video_request": {
                            "tagid": tagid,
                            "track": "false"
                        }
                    };
                    ws3.send(JSON.stringify(param));
                    CallbackRegisterFunc(this_obj.CB_TYPE.WS_VIDEO_CLOSE, JSON.stringify(param));
                }
            }
        };

        //请求标签振动蜂鸣
        this_obj.Send2WS_RequsetTagShakeBuzzReq = function (conf_type, conf_value, tagid) {
            if (ws3) {
                if (ws3.readyState == 1) {
                    var param = {
                        "localsense_conf_request": {
                            "conf_type": conf_type,
                            "conf_value": conf_value,
                            "tagid": tagid
                        }
                    };
                    ws3.send(JSON.stringify(param));
                    CallbackRegisterFunc(this_obj.CB_TYPE.WS_TAG_SHAKE, JSON.stringify(param));
                }
            }
        };

        //抑制告警id的持续推送
        this_obj.sendAlarmWSRequestToServer = function (data) {
            if (data && ws3 && ws3.readyState == 1) {
                var param = {
                    "localsense_alarm_request": {
                        "conf_type": "restrain",
                        "conf_value": data
                    }
                };
                ws3.send(JSON.stringify(param));
            }
        };

        this_obj.Send2WS_SendJsonToServer = function (data) {
            if (ws3) {
                if (ws3.readyState == 1) {
                    ws3.send(JSON.stringify(data));
                }
            }
        };

        // 过滤栏
        this_obj.Send2WS_RssTagClicked = function (tagArr) {
            var rss_content = tagArr;
            var rss_taglst = rss_content == "" ? "" : rss_content.split(":"); //为空时，表示取消订阅
            var tag32or64Len = 4;
            if (tag64Checked) {
                tag32or64Len = 8;
            }
            var buffer = new ArrayBuffer(11 + rss_taglst.length * tag32or64Len);
            var int8view = new Uint8Array(buffer);
            var tIndex = 0;
            int8view[tIndex++] = 0xCC;
            int8view[tIndex++] = 0x5F;
            int8view[tIndex++] = 0xA9;

            int8view[tIndex++] = 0x00;
            int8view[tIndex++] = 0x00;

            int8view[tIndex++] = parseInt(rss_taglst.length) >> 8;
            int8view[tIndex++] = parseInt(rss_taglst.length);

            for (var i = 0; i < rss_taglst.length; i++) {
                var tag16str = "" + Number(rss_taglst[i]).toString(16);
                var tag16 = 0;
                if (tag64Checked) {
                    while (tag16str.length < 16) {
                        tag16str = "0" + tag16str;
                    }
                    int8view[tIndex++] = parseInt(tag16str.substr(0, 2), 16);
                    int8view[tIndex++] = parseInt(tag16str.substr(2, 2), 16);
                    int8view[tIndex++] = parseInt(tag16str.substr(4, 2), 16);
                    int8view[tIndex++] = parseInt(tag16str.substr(6, 2), 16);
                    int8view[tIndex++] = parseInt(tag16str.substr(8, 2), 16);
                    int8view[tIndex++] = parseInt(tag16str.substr(10, 2), 16);
                    int8view[tIndex++] = parseInt(tag16str.substr(12, 2), 16);
                    int8view[tIndex++] = parseInt(tag16str.substr(14, 2), 16);
                } else {
                    while (tag16str.length < 8) {
                        tag16str = "0" + tag16str;
                    }
                    int8view[tIndex++] = parseInt(tag16str.substr(0, 2), 16);
                    int8view[tIndex++] = parseInt(tag16str.substr(2, 2), 16);
                    int8view[tIndex++] = parseInt(tag16str.substr(4, 2), 16);
                    int8view[tIndex++] = parseInt(tag16str.substr(6, 2), 16);
                }

            }

            int8view[tIndex++] = 0xFF;
            int8view[tIndex++] = 0xFF;

            int8view[tIndex++] = 0xAA;
            int8view[tIndex++] = 0xBB;
            //如ws初始化未完成,则注入到回调
            if (ws1 && ws1.readyState == 1) {
                ws1.send(int8view.buffer);
            }
        }

        this_obj.Send2WS_RssGroupClicked = function (mapArr) {
            var rss_content = mapArr;
            var rss_grplst = rss_content == "" ? "" : rss_content.split(":"); //为空时，表示取消订阅
            var rss_len = 0;
            for (var i = 0; i < rss_grplst.length; i++) {
                rss_len += rss_grplst[i].length;
            }
            var buffer = new ArrayBuffer(11 + rss_len);
            var int8view = new Uint8Array(buffer);
            var tIndex = 0;
            int8view[tIndex++] = 0xCC;
            int8view[tIndex++] = 0x5F;
            int8view[tIndex++] = 0xA9;

            int8view[tIndex++] = 0x00;
            int8view[tIndex++] = 0x01;

            int8view[tIndex++] = parseInt(rss_grplst.length) >> 8;
            int8view[tIndex++] = parseInt(rss_grplst.length);

            for (var i = 0; i < rss_grplst.length; i++) {
                int8view[tIndex++] = parseInt(rss_grplst[i].length) >> 8;
                int8view[tIndex++] = parseInt(rss_grplst[i].length);

                for (var j = 0; j < rss_grplst[i].length; j++) {
                    int8view[tIndex++] = rss_grplst[i].charCodeAt(j);
                }

            }

            int8view[tIndex++] = 0xFF;
            int8view[tIndex++] = 0xFF;

            int8view[tIndex++] = 0xAA;
            int8view[tIndex++] = 0xBB;
            ws1.send(int8view.buffer);
        }

        /**
         * 按照地图订阅数据——图层
         */
        this_obj.Send2WS_RssMapClicked = function (mapArr) {
            var rss_content = mapArr;
            var rss_maplst = rss_content == "" ? "" : rss_content.split(":"); //为空时，表示取消订阅
            var buffer = new ArrayBuffer(11 + rss_maplst.length * 4);
            var int8view = new Uint8Array(buffer);
            var tIndex = 0;
            int8view[tIndex++] = 0xCC;
            int8view[tIndex++] = 0x5F;
            int8view[tIndex++] = 0xA9;

            int8view[tIndex++] = 0x00;
            int8view[tIndex++] = 0x02;

            int8view[tIndex++] = parseInt(rss_maplst.length) >> 8;
            int8view[tIndex++] = parseInt(rss_maplst.length);

            for (var i = 0; i < rss_maplst.length; i++) {
                int8view[tIndex++] = parseInt(rss_maplst[i]) >> 24;
                int8view[tIndex++] = parseInt(rss_maplst[i]) >> 16;
                int8view[tIndex++] = parseInt(rss_maplst[i]) >> 8;
                int8view[tIndex++] = parseInt(rss_maplst[i]);
            }

            int8view[tIndex++] = 0xFF;
            int8view[tIndex++] = 0xFF;

            int8view[tIndex++] = 0xAA;
            int8view[tIndex++] = 0xBB;
            //如ws初始化未完成,则注入到回调
            if (ws1 && ws1.readyState == 1) {
                ws1.send(int8view.buffer);
            }
        };

        //字符串转十六进制
        function strToHexCharCode(str) {
            if (str === "") return "";
            var hexCharCode = [];
            hexCharCode.push("0x");
            for (var i = 0; i < str.length; i++) {
                hexCharCode.push((str.charCodeAt(i)).toString(16));
            }
            return hexCharCode.join("");
        };

        //十六进制转字符
        function hexCharCodeToStr(hexCharCodeStr) {
            var trimedStr = hexCharCodeStr.trim();
            var rawStr = trimedStr.substr(0, 2).toLowerCase() === "0x" ? trimedStr.substr(2) : trimedStr;
            var len = rawStr.length;
            if (len % 2 !== 0) {
                alert("Illegal Format ASCII Code!");
                return "";
            }
            var curCharCode;
            var resultStr = [];
            for (var i = 0; i < len; i = i + 2) {
                curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value
                resultStr.push(String.fromCharCode(curCharCode));
            }
            return resultStr.join("");
        };

        //对高位取一次余数运算
        function get_high_1_mod(sor, end) {
            /**
             * 10011100001
             * 110
             */
            var end_len = end.length;
            var fst_sub = sor.substring(0, end_len); //100
            var lst_sub = sor.substring(end_len); //11100001
            if (parseInt(sor.substring(0, end_len), 2) < parseInt(end, 2)) {
                fst_sub = sor.substring(0, end_len + 1); //1001
                lst_sub = sor.substring(end_len + 1); //1100001
            }
            var sub_mod = (parseInt(fst_sub, 2) - parseInt(end, 2)).toString(2); //所减得到的余数
            return sub_mod + lst_sub;
        };

        //十六进制转二进制
        function hexto0b(hex) {
            var len = "" + hex.length;
            return (Array(4 * len).join("0") + parseInt(hex, 16).toString(2)).slice(-4 * len);
        };

        //二进制转16进制
        function btohex(b) {
            var para = "";
            para = b;
            var len = para.length;
            if (!(b.length) % 4 === 0) {
                para = (Array(4 * (Math.ceil(len % 4))).join("0") + b).slice(-len); //为了让 类似11000转为00011000
            }
            var r = "";
            for (var i = 0; i < para.length / 4; i++) {
                r += parseInt(para.substring(4 * i, 4 * (i + 1)), 2).toString(16);
            }
            return r;
        };

        (function () {
            if (m_work_as_worker) {
                var obj = ['INIT_API_FUNC'];
                var val = {};
                for (var k in this_obj) {
                    var func = this_obj[k];
                    if ($.isFunction(func)) {
                        val[k] = true;
                    } else {
                        val[k] = this_obj[k];
                    }
                }

                obj.push(val);

                var str = JSON.stringify(obj);
                //postMessage([obj]);
                postMessage(str);


                window.onmessage = function (e_in) {
                    var this_obj = LOCALSENSE.WEBSOCKET_API;
                    var args_in = JSON.parse(e_in.data);
                    var func = args_in[0];
                    var args = args_in[1];
                    var this_func = this_obj[func];
                    if ($.isFunction(this_func)) {
                        try {
                            this_func.apply(this_obj, args);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                };
            }

        }());

    };

}());