import { useSyncExternalStore } from 'react';

export type Locale = 'zh-CN' | 'zh-TW' | 'en';

const STORAGE_KEY = 'ia-locale';
const SUPPORTED: readonly Locale[] = ['zh-CN', 'zh-TW', 'en'];

const zhTW: Record<string, string> = {
  '语言': '語言', '简体中文': '簡體中文', '繁體中文': '繁體中文', 'English': 'English',
  '剧本大厅': '劇本大廳', '重选邦国': '重選邦國', '治理一个国家数百年。扩张越快，崩溃越早。真正的胜利是建立一个能长期运转的国家机器。': '治理一個國家數百年。擴張越快，崩潰越早。真正的勝利是建立一部能長期運轉的國家機器。', '继续槽位 {{slot}}': '繼續欄位 {{slot}}', '开始推荐剧本': '開始推薦劇本', '查看全部剧本': '查看全部劇本', '选择剧本': '選擇劇本', '按压力和玩法定位选择，不同剧本对应不同学习曲线。': '依壓力和玩法定位選擇，不同劇本對應不同學習曲線。', '压力': '壓力', '推荐': '推薦', '选择邦国': '選擇邦國', '开始剧本': '開始劇本',
  '注册进度': '註冊進度', '验证邮箱并完成注册': '驗證信箱並完成註冊', '填写账号资料': '填寫帳號資料', '显示名称': '顯示名稱', '邮箱': '信箱', '设置密码': '設定密碼', '确认密码': '確認密碼', '两次密码不一致': '兩次密碼不一致', '再次输入同一密码': '再次輸入相同密碼', '注册必须验证邮箱': '註冊必須驗證信箱', '密码不会在验证前生效；验证码由 Appwrite 发送，15 分钟内有效。': '密碼不會在驗證前生效；驗證碼由 Appwrite 傳送，15 分鐘內有效。', '发送验证码，继续注册': '傳送驗證碼，繼續註冊', '验证码已发送': '驗證碼已傳送', '修改资料': '修改資料', '6 位邮箱验证码': '6 位信箱驗證碼', '请检查收件箱与垃圾邮件目录': '請檢查收件匣與垃圾郵件資料夾', '验证邮箱并创建账号': '驗證信箱並建立帳號', '{{seconds}} 秒后可重新发送': '{{seconds}} 秒後可重新傳送', '没有收到？重新发送验证码': '沒有收到？重新傳送驗證碼',
  '返回密码登录': '返回密碼登入', '验证码找回账号': '用驗證碼找回帳號', '验证注册邮箱后设置新密码，并直接恢复登录。': '驗證註冊信箱後設定新密碼，並直接恢復登入。', '注册邮箱': '註冊信箱', '验证码已发送到这个邮箱': '驗證碼已傳送到這個信箱', '请输入需要找回的账号邮箱': '請輸入要找回的帳號信箱', '找回验证码已发送': '找回驗證碼已傳送', '修改邮箱': '修改信箱', '验证码 15 分钟内有效': '驗證碼 15 分鐘內有效', '设置新密码': '設定新密碼', '确认新密码': '確認新密碼', '再次输入新密码': '再次輸入新密碼', '必须先验证邮箱': '必須先驗證信箱', '验证码通过后才会替换旧密码；原有云端进度不会改变。': '驗證碼通過後才會替換舊密碼；原有雲端進度不會改變。', '验证并设置新密码': '驗證並設定新密碼', '发送找回验证码': '傳送找回驗證碼',
  '登录方式': '登入方式', '密码登录': '密碼登入', '邮箱验证码': '信箱驗證碼', '无需密码，验证码 15 分钟内有效': '不需密碼，驗證碼 15 分鐘內有效', '使用已验证邮箱登录': '使用已驗證信箱登入', '密码': '密碼', '至少 8 位字符': '至少 8 個字元', '忘记密码？使用邮箱验证码找回': '忘記密碼？使用信箱驗證碼找回', '6 位验证码': '6 位驗證碼', '已发送至 {{email}}': '已傳送至 {{email}}', '安全登录': '安全登入', '验证并登录': '驗證並登入', '发送登录验证码': '傳送登入驗證碼', '重新发送验证码': '重新傳送驗證碼', '账号操作': '帳號操作', '登录账号': '登入帳號', '注册新账号': '註冊新帳號',
  '请输入邮箱地址': '請輸入信箱地址', '邮箱格式不正确': '信箱格式不正確', '验证码将发送到此邮箱': '驗證碼將傳送到此信箱', '建议同时包含字母和数字': '建議同時包含字母和數字', '密码强度符合要求': '密碼強度符合要求', '显示名称至少 2 个字符': '顯示名稱至少 2 個字元', '显示名称不能超过 32 个字符': '顯示名稱不能超過 32 個字元', '其他玩家将看到此名称': '其他玩家將看到此名稱',
  '第一次玩': '第一次玩', '喜欢经营': '喜歡經營', '喜欢冲突': '喜歡衝突', '追求旗舰长局': '追求旗艦長局', '选地中海黎明，最快理解财政、省份、战争和事件。': '選地中海黎明，最快理解財政、省份、戰爭和事件。', '选印度洋贸易，经济和海贸路线更清晰。': '選印度洋貿易，經濟和海貿路線更清晰。', '选地中海争霸，战争、贸易和外交都很密集。': '選地中海爭霸，戰爭、貿易和外交都很密集。', '选万邦纪元，但建议熟悉系统后再玩。': '選萬邦紀元，但建議熟悉系統後再玩。',
  '治理': '治理', '征伐': '征伐', '纪事': '紀事', '总览': '總覽', '舆图': '輿圖', '省份': '省份', '经济': '經濟', '人口': '人口', '政治': '政治', '科技': '科技', '统计': '統計', '军事': '軍事', '外交': '外交', '年报': '年報', '史册': '史冊', '存档': '存檔',
  '正在展开卷宗…': '正在展開卷宗…', '载入中...': '載入中…', '未名之国': '未名之國', '永恒帝国': '永恆帝國', '君主 · 无名': '君主 · 無名', '战时': '戰時', '待决事件 {{count}}': '待決事件 {{count}}', '已胜利': '已勝利', '已陨落': '已殞落',
  '国库': '國庫', '粮储': '糧儲', '子民': '子民', '安定': '安定', '疆土': '疆土', '行政点': '行政點', '科研点': '科研點', '影响力': '影響力', '净收入': '淨收入',
  '主导航': '主導覽', '快捷键 {{key}}': '快捷鍵 {{key}}', '返回标题页？当前进度不会自动保存。建议先到“存档”页保存。': '返回標題頁？目前進度不會自動儲存。建議先到「存檔」頁儲存。',
  '返回上一页': '返回上一頁', '返回标题页': '返回標題頁', '治国引导': '治國引導', '切换主题': '切換主題', '音效开关': '音效開關', '音效已关（点击开启）': '音效已關（點擊開啟）', '音效已开（点击静音）': '音效已開（點擊靜音）',
  'Esc / ↩ 返回上一页 · 空格下一回合 · T 经济 · {{build}}': 'Esc / ↩ 返回上一頁 · 空白鍵下一回合 · T 經濟 · {{build}}',
  '账号与云存档': '帳號與雲端存檔', '连接账号…': '連接帳號…', '账号 / 云存档': '帳號 / 雲端存檔', '账号与云端纪元': '帳號與雲端紀元', '游客模式始终可玩；验证邮箱后解锁云存档、共享版图、好友与聊天。': '訪客模式始終可玩；驗證信箱後解鎖雲端存檔、共享版圖、好友與聊天。', '关闭账号窗口': '關閉帳號視窗', 'Appwrite 尚未配置，当前仅提供本地存档。': 'Appwrite 尚未設定，目前僅提供本機存檔。', '未设置昵称': '未設定暱稱', '邮箱已验证': '信箱已驗證', '待验证': '待驗證', '私有云存档': '私人雲端存檔', '共享版图': '共享版圖', '好友联络': '好友聯絡', '刷新云存档': '重新整理雲端存檔', '退出登录': '登出', '云端保存使用用户专属行与文件权限。上传、下载和冲突选择请在游戏“存档”页操作。': '雲端儲存使用使用者專屬資料列與檔案權限。上傳、下載和衝突選擇請在遊戲「存檔」頁操作。', 'Appwrite 安全认证': 'Appwrite 安全認證', '邮箱不会向其他玩家公开': '信箱不會向其他玩家公開',
  '共享活版图': '共享活版圖', '玩家控制部分国家，其余国家由 AI 持续治理；整个版图使用统一年份。': '玩家控制部分國家，其餘國家由 AI 持續治理；整個版圖使用統一年份。', '关闭': '關閉', '需要先登录账号': '需要先登入帳號', '共享版图涉及国家控制权和多人世界状态，游客仍可继续使用完整单机模式。': '共享版圖涉及國家控制權和多人世界狀態，訪客仍可繼續使用完整單機模式。', '正在读取版图纪元…': '正在讀取版圖紀元…', '首张共享版图正在筹备': '首張共享版圖正在籌備', '基础设施已经接入；版图开放后会在这里显示世界年份、控制人数和可认领国家。': '基礎設施已經接入；版圖開放後會在這裡顯示世界年份、控制人數和可認領國家。',
  '运行中': '運行中', '已暂停': '已暫停', '筹备中': '籌備中', '第 {{year}} 年': '第 {{year}} 年', '{{count}} 国共享同一历史进程 · 无人控制国家由 AI 自主推进': '{{count}} 國共享同一歷史進程 · 無人控制國家由 AI 自主推進', '进入版图大厅 →': '進入版圖大廳 →', '← 版图列表': '← 版圖列表', '第 {{year}} 年 · 修订 {{revision}}': '第 {{year}} 年 · 修訂 {{revision}}', '我控制 {{mine}}/{{max}}': '我控制 {{mine}}/{{max}}',
  '有人在线才推进': '有人在線才推進', '离线国家保守托管': '離線國家保守託管', 'AI 国家持续发展': 'AI 國家持續發展', '统一年度结算': '統一年度結算', '认领国家': '認領國家', '版图初始化': '版圖初始化', '进入治理': '進入治理', '先选择一个可认领国家': '先選擇一個可認領國家', '共享纪元已经可以进入': '共享紀元已經可以進入', '国家已认领，可以创建首个权威世界快照': '國家已認領，可以建立首個權威世界快照', '认领后控制权会绑定账号；其他玩家不能重复选择。': '認領後控制權會綁定帳號；其他玩家不能重複選擇。', '进入后行动会先由服务器校验，再写入统一世界状态。': '進入後行動會先由伺服器校驗，再寫入統一世界狀態。', '首次进入会初始化整张版图；之后所有玩家读取同一个纪元，不会各玩各的。': '首次進入會初始化整張版圖；之後所有玩家讀取同一個紀元，不會各玩各的。', '载入纪元中…': '載入紀元中…', '初始化并进入治理': '初始化並進入治理', '版图已暂停': '版圖已暫停', '请先认领国家': '請先認領國家',
  '由我控制': '由我控制', '可认领': '可認領', '已有统治者': '已有統治者', '离线时由保守 AI 托管，不会停止发展。': '離線時由保守 AI 託管，不會停止發展。', '认领后可与账号下其他国家自由切换。': '認領後可與帳號下其他國家自由切換。', '不可重复选择；对方释放或租约到期后重新开放。': '不可重複選擇；對方釋放或租約到期後重新開放。', '以此国进入': '以此國進入', '处理中…': '處理中…', '释放控制': '釋放控制', '已达本版图上限': '已達本版圖上限', '认领中…': '認領中…',
  '社交': '社交', '社交与好友': '社交與好友', '社交，有 {{count}} 个待处理好友申请': '社交，有 {{count}} 個待處理好友申請', '好友与联络': '好友與聯絡', '建立跨版图联系；聊天内容仍只在共同版图内可见。': '建立跨版圖聯絡；聊天內容仍只在共同版圖內可見。', '关闭社交窗口': '關閉社交視窗', '登录后可以使用好友码添加玩家，并在共同版图中聊天。': '登入後可以使用好友碼新增玩家，並在共同版圖中聊天。', '已建立好友': '已建立好友', '待处理申请': '待處理申請', '版图内': '版圖內', '聊天可见范围': '聊天可見範圍', '我的好友码': '我的好友碼', '读取中…': '讀取中…', '可以公开分享，不会显示登录邮箱。': '可以公開分享，不會顯示登入信箱。', '好友码': '好友碼', '输入 IA 开头的好友码': '輸入 IA 開頭的好友碼', '发送好友申请': '傳送好友申請', '申请添加你': '申請加你為好友', '接受': '接受', '拒绝': '拒絕', '我的好友 · {{count}}': '我的好友 · {{count}}', '好友': '好友', '对话': '對話', '移除': '移除', '暂时还没有好友，可以使用好友码添加。': '暫時還沒有好友，可以使用好友碼新增。',
  '版图频道': '版圖頻道', '同版图成员实时联络': '同版圖成員即時聯絡', '收起 ↑': '收起 ↑', '打开 →': '開啟 →', '万邦会谈室': '萬邦會談室', '实时消息 · 最近 50 条': '即時訊息 · 最近 50 則', '文字与图片仅本版图成员可见': '文字與圖片僅本版圖成員可見', '我': '我', '当前执政国': '目前執政國', '版图成员': '版圖成員', '{{name}} 分享的图片': '{{name}} 分享的圖片', '频道尚未留下记录': '頻道尚未留下紀錄', '向同版图统治者发送第一条消息。': '向同版圖統治者傳送第一則訊息。', '版图消息': '版圖訊息', '为图片添加说明（可选）': '為圖片加入說明（可選）', '输入消息；Enter 发送，Shift + Enter 换行': '輸入訊息；Enter 傳送，Shift + Enter 換行', '图片': '圖片', '发送图片': '傳送圖片', '发送': '傳送', '好友列表': '好友列表', '仅你与对方可见 · 实时文字与图片': '僅你與對方可見 · 即時文字與圖片', '好友分享的图片': '好友分享的圖片', '开始私密对话': '開始私人對話', '消息只授权给你和这位好友读取。': '訊息僅授權你與這位好友讀取。', '给图片附带一句说明（可选）': '為圖片附上一句說明（可選）', '发送消息给 {{name}}': '傳送訊息給 {{name}}',
  '新手引导': '新手引導', '展开新手引导，第 {{current}} 步，共 {{total}} 步': '展開新手引導，第 {{current}} 步，共 {{total}} 步', '首局实战引导': '首局實戰引導', '第 {{current}}/{{total}} 步 · {{title}}': '第 {{current}}/{{total}} 步 · {{title}}', '收起引导': '收起引導', '收起新手引导': '收起新手引導', '引导进度 {{percent}}%': '引導進度 {{percent}}%', '为什么：': '為什麼：', '结束引导': '結束引導', '我看懂了，下一步': '我看懂了，下一步', '首局实战引导完成': '首局實戰引導完成', '你已经掌握核心治理循环': '你已經掌握核心治理循環', '先读总览，做出决策，保存分支，谨慎推进，再用年报修正下一年计划。接下来可以自由探索外交、科技和战争。': '先讀總覽，做出決策，儲存分支，謹慎推進，再用年報修正下一年計畫。接下來可以自由探索外交、科技和戰爭。', '下一步建议：回到总览，选择一条胜利路线，并只解决当前最重要的一件事。': '下一步建議：回到總覽，選擇一條勝利路線，並只解決目前最重要的一件事。', '继续自由治理': '繼續自由治理', '回总览制定计划': '回總覽制定計畫',
  '主题模式': '主題模式', '{{theme}}主题': '{{theme}}主題', '暗夜': '暗夜', '羊皮': '羊皮', '竹简': '竹簡', '水墨': '水墨',
  '玩法速查': '玩法速查', '先会治理，再谈征服': '先會治理，再談征服', 'Imperium Aeternum 的核心不是点完所有按钮，而是建立“计划 → 推进 → 复盘 → 修正计划”的长期治理循环。': 'Imperium Aeternum 的核心不是點完所有按鈕，而是建立「計畫 → 推進 → 複盤 → 修正計畫」的長期治理循環。', '第一局建议选地中海黎明；每年先看总览页，再决定是否结束本年。': '第一局建議選地中海黎明；每年先看總覽頁，再決定是否結束本年。',
  '一年怎么推进': '一年怎麼推進', '不要直接连跳回合。先看路线，再看风险，最后用年报修正下一年计划。': '不要直接連跳回合。先看路線，再看風險，最後用年報修正下一年計畫。', '帝国路线图': '帝國路線圖', '作战会议': '作戰會議', '下一回合预演': '下一回合預演',
  '不知道点哪里时': '不知道點哪裡時', '总览页已经把分散系统聚合成可执行入口。优先听行动中心，其次看情境式提示。': '總覽頁已經把分散系統聚合成可執行入口。優先聽行動中心，其次看情境式提示。', '情境提示': '情境提示', '行动中心': '行動中心', '总参谋部': '總參謀部',
  '什么时候该停手': '什麼時候該停手', '红色项代表继续推进会扩大损失。战争、低稳定、财政赤字和待决事件都应该先处理。': '紅色項代表繼續推進會擴大損失。戰爭、低穩定、財政赤字和待決事件都應該先處理。', '先存档': '先存檔', '先修红项': '先修紅項', '看外交情报': '看外交情報',
  '长期玩什么': '長期玩什麼', '游戏不是只看眼前数值。国运目标、胜利路线和帝国史册会把长期主线串起来。': '遊戲不是只看眼前數值。國運目標、勝利路線和帝國史冊會把長期主線串起來。', '四条胜利路线': '四條勝利路線', '帝国史册': '帝國史冊', '挑战阶梯': '挑戰階梯',
  '休闲入门': '休閒入門', '最适合第一局建立基本循环': '最適合第一局建立基本循環', '国家少、信息密度低、战争和外交压力可控，适合学习财政、省份、事件和年报。': '國家少、資訊密度低、戰爭和外交壓力可控，適合學習財政、省份、事件和年報。', '推荐前置：': '推薦前置：', '常见失败：': '常見失敗：', '第 {{index}} 阶': '第 {{index}} 階',
  '立即开始': '立即開始', '选择邦国后开始': '選擇邦國後開始', '继续游戏': '繼續遊戲', '刷新体检': '重新整理檢查', '未知国家': '未知國家',
};

const en: Record<string, string> = {
  '语言': 'Language', '简体中文': '简体中文', '繁體中文': '繁體中文', 'English': 'English',
  '剧本大厅': 'Campaign lobby', '重选邦国': 'Choose another nation', '治理一个国家数百年。扩张越快，崩溃越早。真正的胜利是建立一个能长期运转的国家机器。': 'Govern a nation across centuries. Rapid expansion invites collapse; true victory is a state built to endure.', '继续槽位 {{slot}}': 'Continue slot {{slot}}', '开始推荐剧本': 'Start recommended campaign', '查看全部剧本': 'View all campaigns', '选择剧本': 'Choose a Campaign', '按压力和玩法定位选择，不同剧本对应不同学习曲线。': 'Choose by pressure and play style. Each campaign has a different learning curve.', '压力': 'Pressure', '推荐': 'Recommended', '选择邦国': 'Choose nation', '开始剧本': 'Start campaign',
  '注册进度': 'Registration progress', '验证邮箱并完成注册': 'Verify email and finish registration', '填写账号资料': 'Enter account details', '显示名称': 'Display name', '邮箱': 'Email', '设置密码': 'Set password', '确认密码': 'Confirm password', '两次密码不一致': 'Passwords do not match', '再次输入同一密码': 'Enter the same password again', '注册必须验证邮箱': 'Email verification is required', '密码不会在验证前生效；验证码由 Appwrite 发送，15 分钟内有效。': 'Your password is not activated until verification. Appwrite sends a code valid for 15 minutes.', '发送验证码，继续注册': 'Send code and continue', '验证码已发送': 'Verification code sent', '修改资料': 'Edit details', '6 位邮箱验证码': '6-digit email code', '请检查收件箱与垃圾邮件目录': 'Check your inbox and spam folder', '验证邮箱并创建账号': 'Verify email and create account', '{{seconds}} 秒后可重新发送': 'Resend in {{seconds}}s', '没有收到？重新发送验证码': 'Did not receive it? Resend code',
  '返回密码登录': 'Return to password login', '验证码找回账号': 'Recover Account by Email Code', '验证注册邮箱后设置新密码，并直接恢复登录。': 'Verify your registered email, set a new password, and sign back in.', '注册邮箱': 'Registered email', '验证码已发送到这个邮箱': 'A code was sent to this email', '请输入需要找回的账号邮箱': 'Enter the email of the account to recover', '找回验证码已发送': 'Recovery code sent', '修改邮箱': 'Change email', '验证码 15 分钟内有效': 'The code is valid for 15 minutes', '设置新密码': 'New password', '确认新密码': 'Confirm new password', '再次输入新密码': 'Enter the new password again', '必须先验证邮箱': 'Email must be verified first', '验证码通过后才会替换旧密码；原有云端进度不会改变。': 'The old password is replaced only after verification. Existing cloud progress remains unchanged.', '验证并设置新密码': 'Verify and set new password', '发送找回验证码': 'Send recovery code',
  '登录方式': 'Sign-in method', '密码登录': 'Password', '邮箱验证码': 'Email code', '无需密码，验证码 15 分钟内有效': 'No password required; the code is valid for 15 minutes', '使用已验证邮箱登录': 'Sign in with your verified email', '密码': 'Password', '至少 8 位字符': 'At least 8 characters', '忘记密码？使用邮箱验证码找回': 'Forgot password? Recover with an email code', '6 位验证码': '6-digit code', '已发送至 {{email}}': 'Sent to {{email}}', '安全登录': 'Sign in securely', '验证并登录': 'Verify and sign in', '发送登录验证码': 'Send sign-in code', '重新发送验证码': 'Resend code', '账号操作': 'Account action', '登录账号': 'Sign in', '注册新账号': 'Create account',
  '请输入邮箱地址': 'Enter your email address', '邮箱格式不正确': 'Invalid email format', '验证码将发送到此邮箱': 'The code will be sent to this email', '建议同时包含字母和数字': 'Use both letters and numbers', '密码强度符合要求': 'Password meets the requirements', '显示名称至少 2 个字符': 'Display name must contain at least 2 characters', '显示名称不能超过 32 个字符': 'Display name cannot exceed 32 characters', '其他玩家将看到此名称': 'Other players will see this name',
  '第一次玩': 'First campaign', '喜欢经营': 'Economic play', '喜欢冲突': 'Conflict-focused', '追求旗舰长局': 'Epic long campaign', '选地中海黎明，最快理解财政、省份、战争和事件。': 'Mediterranean Dawn is the fastest way to learn finance, provinces, war, and events.', '选印度洋贸易，经济和海贸路线更清晰。': 'Indian Ocean Trade offers a clearer economy and maritime trade network.', '选地中海争霸，战争、贸易和外交都很密集。': 'Mediterranean Rivalry keeps war, trade, and diplomacy tightly connected.', '选万邦纪元，但建议熟悉系统后再玩。': 'Choose Age of Nations after learning the core systems.',
  '地中海黎明': 'Mediterranean Dawn', '经典小局，节奏快，适合熟悉系统。': 'A fast classic campaign designed for learning the systems.', '万邦纪元': 'Age of Nations', '完整世界剧本，适合长期经营。': 'A complete world campaign for long-term governance.', '东方破晓': 'Eastern Dawn', '秦、汉、匈奴、孔雀同台。': 'Qin, Han, Xiongnu, and Maurya share the stage.', '东亚风云': 'East Asian Struggle', '东亚、中亚、南亚三洲角逐。': 'A contest spanning East, Central, and South Asia.', '地中海争霸': 'Mediterranean Rivalry', '罗马、迦太基、波斯、努米底亚争霸。': 'Rome, Carthage, Persia, and Numidia compete for dominance.', '新大陆崛起': 'Rise of the Americas', '美洲文明独立发展线。': 'An independent development path for American civilizations.', '随机大陆': 'Random Continent', '随机抽取一洲开局，每次不同。': 'Begin on a randomly selected continent each time.', '欧洲封建': 'Feudal Europe', '欧洲多国封建争霸。': 'Feudal powers compete across Europe.', '印度洋贸易': 'Indian Ocean Trade', '南亚、东非、中东围绕海贸争霸。': 'South Asia, East Africa, and the Middle East compete over maritime trade.', '帝国黄昏': 'Twilight of Empire', '资源匮乏、叛乱高发、外交孤立。': 'Scarce resources, frequent rebellion, and diplomatic isolation.',
  '治理': 'Govern', '征伐': 'War', '纪事': 'Records', '总览': 'Overview', '舆图': 'Map', '省份': 'Provinces', '经济': 'Economy', '人口': 'Population', '政治': 'Politics', '科技': 'Technology', '统计': 'Statistics', '军事': 'Military', '外交': 'Diplomacy', '年报': 'Annual Report', '史册': 'Chronicle', '存档': 'Saves',
  '正在展开卷宗…': 'Opening records…', '载入中...': 'Loading…', '未名之国': 'Unnamed Nation', '永恒帝国': 'Imperium Aeternum', '君主 · 无名': 'Ruler · Unnamed', '战时': 'At War', '待决事件 {{count}}': '{{count}} Pending Events', '已胜利': 'Victory', '已陨落': 'Defeated',
  '国库': 'Treasury', '粮储': 'Food', '子民': 'Population', '安定': 'Stability', '疆土': 'Provinces', '行政点': 'Administration', '科研点': 'Research', '影响力': 'Influence', '净收入': 'Net Income',
  '主导航': 'Main navigation', '快捷键 {{key}}': 'Shortcut {{key}}', '返回标题页？当前进度不会自动保存。建议先到“存档”页保存。': 'Return to the title screen? Progress is not saved automatically. Save first if you want to keep it.',
  '返回上一页': 'Back', '返回标题页': 'Title screen', '治国引导': 'Governance guide', '切换主题': 'Change theme', '音效开关': 'Sound toggle', '音效已关（点击开启）': 'Sound off (click to enable)', '音效已开（点击静音）': 'Sound on (click to mute)', 'Esc / ↩ 返回上一页 · 空格下一回合 · T 经济 · {{build}}': 'Esc / ↩ Back · Space Next year · T Economy · {{build}}',
  '账号与云存档': 'Account and Cloud Saves', '连接账号…': 'Connecting…', '账号 / 云存档': 'Account / Cloud', '账号与云端纪元': 'Account and Cloud Era', '游客模式始终可玩；验证邮箱后解锁云存档、共享版图、好友与聊天。': 'Guest play is always available. Verify your email to unlock cloud saves, shared worlds, friends, and chat.', '关闭账号窗口': 'Close account window', 'Appwrite 尚未配置，当前仅提供本地存档。': 'Appwrite is not configured; only local saves are available.', '未设置昵称': 'No display name', '邮箱已验证': 'Email verified', '待验证': 'Verification required', '私有云存档': 'Private cloud saves', '共享版图': 'Shared worlds', '好友联络': 'Friends', '刷新云存档': 'Refresh cloud saves', '退出登录': 'Sign out', '云端保存使用用户专属行与文件权限。上传、下载和冲突选择请在游戏“存档”页操作。': 'Cloud saves use private row and file permissions. Upload, download, and resolve conflicts from the Saves screen.', 'Appwrite 安全认证': 'Secured by Appwrite', '邮箱不会向其他玩家公开': 'Your email is never shown to other players',
  '共享活版图': 'Shared Living World', '玩家控制部分国家，其余国家由 AI 持续治理；整个版图使用统一年份。': 'Players govern claimed nations while AI governs the rest. The entire world advances on one timeline.', '关闭': 'Close', '需要先登录账号': 'Sign in first', '共享版图涉及国家控制权和多人世界状态，游客仍可继续使用完整单机模式。': 'Shared worlds require an account for nation control and multiplayer state. Full single-player remains available to guests.', '正在读取版图纪元…': 'Loading worlds…', '首张共享版图正在筹备': 'The first shared world is being prepared', '基础设施已经接入；版图开放后会在这里显示世界年份、控制人数和可认领国家。': 'Once opened, this lobby will show the year, rulers, and nations available to claim.',
  '运行中': 'Active', '已暂停': 'Paused', '筹备中': 'Preparing', '第 {{year}} 年': 'Year {{year}}', '{{count}} 国共享同一历史进程 · 无人控制国家由 AI 自主推进': '{{count}} nations share one history · AI advances every unclaimed nation', '进入版图大厅 →': 'Open world lobby →', '← 版图列表': '← World list', '第 {{year}} 年 · 修订 {{revision}}': 'Year {{year}} · Revision {{revision}}', '我控制 {{mine}}/{{max}}': 'My nations {{mine}}/{{max}}',
  '有人在线才推进': 'Advances while players are active', '离线国家保守托管': 'Conservative offline stewardship', 'AI 国家持续发展': 'AI nations keep developing', '统一年度结算': 'One annual settlement', '认领国家': 'Claim a nation', '版图初始化': 'Initialize world', '进入治理': 'Enter governance', '先选择一个可认领国家': 'Choose an available nation first', '共享纪元已经可以进入': 'The shared era is ready', '国家已认领，可以创建首个权威世界快照': 'Nation claimed; the authoritative world can now be initialized', '认领后控制权会绑定账号；其他玩家不能重复选择。': 'The claim is bound to your account, so no other player can select that nation.', '进入后行动会先由服务器校验，再写入统一世界状态。': 'The server validates every action before writing it to the shared world.', '首次进入会初始化整张版图；之后所有玩家读取同一个纪元，不会各玩各的。': 'The first entry initializes the world. Every player then reads and changes the same era.', '载入纪元中…': 'Loading era…', '初始化并进入治理': 'Initialize and enter', '版图已暂停': 'World paused', '请先认领国家': 'Claim a nation first',
  '由我控制': 'Controlled by me', '可认领': 'Available', '已有统治者': 'Claimed', '离线时由保守 AI 托管，不会停止发展。': 'A conservative AI steward keeps it developing while you are offline.', '认领后可与账号下其他国家自由切换。': 'After claiming, you can switch freely among your nations.', '不可重复选择；对方释放或租约到期后重新开放。': 'Unavailable until its ruler releases control or the lease expires.', '以此国进入': 'Enter as this nation', '处理中…': 'Processing…', '释放控制': 'Release control', '已达本版图上限': 'World limit reached', '认领中…': 'Claiming…',
  '社交': 'Social', '社交与好友': 'Social and Friends', '社交，有 {{count}} 个待处理好友申请': 'Social, {{count}} pending friend requests', '好友与联络': 'Friends and Messages', '建立跨版图联系；聊天内容仍只在共同版图内可见。': 'Keep friends across worlds and message them directly.', '关闭社交窗口': 'Close social window', '登录后可以使用好友码添加玩家，并在共同版图中聊天。': 'Sign in to add players by friend code and chat.', '已建立好友': 'Friends', '待处理申请': 'Pending requests', '版图内': 'In-world', '聊天可见范围': 'World chat visibility', '我的好友码': 'My friend code', '读取中…': 'Loading…', '可以公开分享，不会显示登录邮箱。': 'Safe to share publicly; it never reveals your login email.', '好友码': 'Friend code', '输入 IA 开头的好友码': 'Enter a friend code beginning with IA', '发送好友申请': 'Send friend request', '申请添加你': 'Wants to add you', '接受': 'Accept', '拒绝': 'Decline', '我的好友 · {{count}}': 'My friends · {{count}}', '好友': 'Friend', '对话': 'Message', '移除': 'Remove', '暂时还没有好友，可以使用好友码添加。': 'No friends yet. Add someone using their friend code.',
  '版图频道': 'World Channel', '同版图成员实时联络': 'Live contact with rulers in this world', '收起 ↑': 'Collapse ↑', '打开 →': 'Open →', '万邦会谈室': 'World Council Chamber', '实时消息 · 最近 50 条': 'Live messages · latest 50', '文字与图片仅本版图成员可见': 'Text and images are visible only to world members', '我': 'Me', '当前执政国': 'Current nation', '版图成员': 'World member', '{{name}} 分享的图片': 'Image shared by {{name}}', '频道尚未留下记录': 'No messages yet', '向同版图统治者发送第一条消息。': 'Send the first message to the other rulers.', '版图消息': 'World message', '为图片添加说明（可选）': 'Add an optional caption', '输入消息；Enter 发送，Shift + Enter 换行': 'Type a message; Enter to send, Shift + Enter for a new line', '图片': 'Image', '发送图片': 'Send image', '发送': 'Send', '好友列表': 'Friend list', '仅你与对方可见 · 实时文字与图片': 'Visible only to you both · live text and images', '好友分享的图片': 'Image shared by friend', '开始私密对话': 'Start a private conversation', '消息只授权给你和这位好友读取。': 'Only you and this friend are authorized to read these messages.', '给图片附带一句说明（可选）': 'Add an optional caption', '发送消息给 {{name}}': 'Message {{name}}',
  '新手引导': 'New Player Guide', '展开新手引导，第 {{current}} 步，共 {{total}} 步': 'Open new player guide, step {{current}} of {{total}}', '首局实战引导': 'First campaign guide', '第 {{current}}/{{total}} 步 · {{title}}': 'Step {{current}}/{{total}} · {{title}}', '收起引导': 'Collapse guide', '收起新手引导': 'Collapse new player guide', '引导进度 {{percent}}%': 'Guide progress {{percent}}%', '为什么：': 'Why: ', '结束引导': 'End guide', '我看懂了，下一步': 'Understood, next step', '首局实战引导完成': 'First campaign guide completed', '你已经掌握核心治理循环': 'You have learned the core governance loop', '先读总览，做出决策，保存分支，谨慎推进，再用年报修正下一年计划。接下来可以自由探索外交、科技和战争。': 'Read the overview, make decisions, save a branch, advance carefully, then use the annual report to adjust next year. You are ready to explore diplomacy, technology, and war.', '下一步建议：回到总览，选择一条胜利路线，并只解决当前最重要的一件事。': 'Next: return to the overview, choose a victory path, and solve the single most important problem first.', '继续自由治理': 'Continue freely', '回总览制定计划': 'Plan from overview',
  '主题模式': 'Theme mode', '{{theme}}主题': '{{theme}} theme', '暗夜': 'Night', '羊皮': 'Parchment', '竹简': 'Bamboo', '水墨': 'Ink',
  '玩法速查': 'Quick Guide', '先会治理，再谈征服': 'Learn to govern before you conquer', 'Imperium Aeternum 的核心不是点完所有按钮，而是建立“计划 → 推进 → 复盘 → 修正计划”的长期治理循环。': 'Imperium Aeternum is not about clicking every button. Build a lasting loop: plan → advance → review → adjust.', '第一局建议选地中海黎明；每年先看总览页，再决定是否结束本年。': 'Choose Mediterranean Dawn first. Review the overview every year before ending the turn.',
  '一年怎么推进': 'How to advance a year', '不要直接连跳回合。先看路线，再看风险，最后用年报修正下一年计划。': 'Do not skip turns blindly. Check your route and risks, then use the annual report to adjust next year.', '帝国路线图': 'Imperial roadmap', '作战会议': 'War council', '下一回合预演': 'Next-turn forecast',
  '不知道点哪里时': 'When you are unsure what to do', '总览页已经把分散系统聚合成可执行入口。优先听行动中心，其次看情境式提示。': 'The overview gathers scattered systems into clear actions. Follow the action center first, then contextual guidance.', '情境提示': 'Context guidance', '行动中心': 'Action center', '总参谋部': 'General staff',
  '什么时候该停手': 'When to stop', '红色项代表继续推进会扩大损失。战争、低稳定、财政赤字和待决事件都应该先处理。': 'Red items mean advancing will compound losses. Resolve war, low stability, deficits, and pending events first.', '先存档': 'Save first', '先修红项': 'Fix red items', '看外交情报': 'Review intelligence',
  '长期玩什么': 'Long-term goals', '游戏不是只看眼前数值。国运目标、胜利路线和帝国史册会把长期主线串起来。': 'The game is more than immediate numbers. National goals, victory paths, and the chronicle form your long-term story.', '四条胜利路线': 'Four victory paths', '帝国史册': 'Imperial chronicle', '挑战阶梯': 'Challenge ladder',
  '休闲入门': 'Relaxed introduction', '最适合第一局建立基本循环': 'Best first campaign for learning the core loop', '国家少、信息密度低、战争和外交压力可控，适合学习财政、省份、事件和年报。': 'Fewer nations and manageable pressure make it ideal for learning finance, provinces, events, and reports.', '无需前置经验。': 'No prior experience required.', '通常不是被打崩，而是忽略年报和财政趋势。': 'The usual danger is ignoring reports and fiscal trends, not military defeat.', '先看路线图和情境提示': 'Read the roadmap and guidance first', '第一年后读年报复盘': 'Review the annual report after year one',
  '推荐前置：': 'Recommended preparation:', '常见失败：': 'Common failure:', '第 {{index}} 阶': 'Tier {{index}}', '推荐按挑战阶梯逐步解锁：先学财政和省份，再学战争外交，最后进入完整世界或硬核生存。': 'Advance through the ladder: learn finance and provinces, then war and diplomacy, and finally the full world or survival challenge.',
  '标准经营': 'Standard economy', '标准扩张': 'Standard expansion', '困难冲突': 'Hard conflict', '旗舰困难': 'Flagship hard', '硬核挑战': 'Hardcore challenge',
  '继续游戏': 'Continue', '刷新体检': 'Refresh check', '未知国家': 'Unknown nation', '推荐继续：槽位 {{slot}} · {{nation}} · 第 {{year}} 年': 'Recommended: slot {{slot}} · {{nation}} · year {{year}}', '暂无可继续存档': 'No playable save found',
  '立即开始': 'Start now', '选择邦国后开始': 'Choose a nation to begin',
  '5 国': '5 nations', '205 国': '205 nations', '东亚': 'East Asia', '挑战': 'Challenge',
};

// Dynamic launch/gameplay copy lives with the pure domain helpers. Keep its UI
// translations here so changing locale never exposes a half-translated lobby.
const enLaunch: Record<string, string> = {
  '暂无可继续存档': 'No playable save found',
  '推荐从“地中海黎明”开始，先建立一套稳定玩法循环。': 'Start with Mediterranean Dawn and build a stable play loop first.',
  '可读 {{playable}}/{{total}}': 'Playable {{playable}}/{{total}}',
  '可修复 {{count}}': '{{count}} repairable',
  '损坏 {{count}}': '{{count}} damaged',
  '新手首选': 'Best for beginners', '旗舰长局': 'Epic campaign', '东方入门': 'Eastern introduction', '东方长线': 'Eastern long campaign',
  '战争贸易': 'War and trade', '文明成长': 'Civilization growth', '重开乐趣': 'Replay challenge', '外交战争': 'Diplomacy and war', '贸易推荐': 'Trade focus',
  '困难长线': 'Hard long campaign', '标准成长': 'Standard growth', '随机挑战': 'Random challenge', '困难外交': 'Hard diplomacy',
  '5 国 · 50 省': '5 nations · 50 provinces', '205 国 · 577 省': '205 nations · 577 provinces', '东亚剧本': 'East Asia campaign',
  'W3 · 东亚 3 洲': 'W3 · 3 Asian regions', 'W5 · 地中海 4 洲': 'W5 · 4 Mediterranean regions', 'W6 · 美洲 1 洲': 'W6 · Americas',
  'W7 · 随机洲': 'W7 · Random region', 'W4 · 欧洲 4 洲': 'W4 · 4 European regions', 'W8 · 印度洋 3 洲': 'W8 · 3 Indian Ocean regions',
  '挑战 · 高压生存': 'Challenge · High-pressure survival', '~50 国': '~50 nations', '~70 国': '~70 nations', '~20 国': '~20 nations', '~20-40 国': '~20–40 nations', '~60 国': '~60 nations', '~55 国': '~55 nations',
  '完整世界沙盘，信息密度最高': 'The complete world sandbox with the highest information density',
  '建议先完成至少一局标准或困难区域剧本。': 'Complete at least one standard or hard regional campaign first.',
  '区域扩张和内政稳定并重': 'Balance regional expansion with domestic stability', '至少熟悉行动中心和省份页。': 'Learn the action center and provinces screen first.',
  '东方大区长期博弈': 'A long strategic contest across eastern regions', '熟悉路线图、作战会议、年报复盘。': 'Learn the roadmap, war council, and annual review.',
  '战争、贸易和外交都很密集': 'War, trade, and diplomacy are all intense', '至少能稳定处理战争、补给、外交情报。': 'Be able to manage war, supply, and diplomatic intelligence.',
  '较少外部干扰的文明成长线': 'Civilization growth with less outside interference', '适合第二局或喜欢独立发展线的玩家。': 'Ideal for a second campaign or independent growth.',
  '每局压力不同，考验适应能力': 'Every campaign differs and tests adaptability', '至少完成一局标准或困难剧本。': 'Complete at least one standard or hard campaign first.',
  '联盟、边境和多国关系压力高': 'High pressure from alliances, borders, and many relationships', '熟悉外交情报和作战会议。': 'Learn diplomatic intelligence and the war council.',
  '适合经营玩家的贸易成长线': 'A trade-led growth path for economic players', '完成一局地中海黎明，理解财政和省份。': 'Complete Mediterranean Dawn and understand finance and provinces.',
  '资源少、叛乱高、外交孤立': 'Scarce resources, frequent rebellion, and diplomatic isolation', '熟悉存档体检、作战会议、下一回合预演后再挑战。': 'Learn save checks, the war council, and turn forecasts before attempting this.',
  '确认清理本浏览器里的全部 Imperium Aeternum 存档？': 'Delete every Imperium Aeternum save in this browser?',
  '难度 {{level}}': 'Difficulty {{level}}', '低': 'Low', '中': 'Medium', '中高': 'Medium–high', '高': 'High', '极高': 'Extreme', '未知': 'Unknown',
  '第一次玩 / 快速理解系统': 'First campaign / learn quickly', '熟悉系统后的长期玩家': 'Long-term players familiar with the systems',
  '喜欢秦汉、草原和南亚互动': 'Players interested in Qin–Han, steppe, and South Asian interaction', '喜欢东方大区长期博弈': 'Players who enjoy long eastern campaigns',
  '喜欢罗马、迦太基、波斯冲突': 'Players who enjoy Roman, Carthaginian, and Persian conflict', '喜欢较少外交干扰的成长线': 'Players who prefer growth with less diplomatic pressure',
  '老手 / 每局想要不同开局': 'Veterans seeking a different opening each time', '喜欢联盟、边境和多国关系': 'Players who enjoy alliances, borders, and many-state relations',
  '喜欢贸易和港口路线': 'Players who enjoy trade and port networks', '硬核玩家 / 失败也能接受': 'Hardcore players comfortable with failure',
  '选择你的邦国': 'Choose your nation', '即将开始': 'Campaign ready', '你的邦国': 'Your nation', '← 返回': '← Back', '开启纪元 →': 'Begin era →',
  '读取自动存档': 'Load autosave', '刷新存档体检': 'Refresh save check', '清理本地存档': 'Delete local saves', '修复并继续': 'Repair and continue', '继续最佳存档': 'Continue best save',
  '{{label}} · 体检 {{score}}/100{{repairs}}': '{{label}} · Check {{score}}/100{{repairs}}', ' · 将自动：{{items}}': ' · Automatic: {{items}}', '、': ', ',
  '挑战': 'Challenge', '贸易': 'Trade', '军事': 'Military', '行政': 'Administration', '民生': 'Welfare', '强国': 'Great power', '稳健': 'Balanced',
  '波斯帝国': 'Persian Empire', '秦帝国': 'Qin Empire', '罗马': 'Rome', '迦太基': 'Carthage', '汉': 'Han', '孔雀帝国': 'Maurya Empire', '印加': 'Inca', '法兰克': 'Franks',
  '匈奴汗国': 'Xiongnu Khanate', '努米底亚': 'Numidia', '阿兹特克': 'Aztec', '玛雅': 'Maya', '基辅罗斯': 'Kievan Rus’', '室利佛逝': 'Srivijaya', '埃及王国': 'Kingdom of Egypt',
};

let currentLocale: Locale = detectLocale();
const listeners = new Set<() => void>();

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.includes(saved as Locale)) return saved as Locale;
  } catch { /* preference storage is optional */ }
  const language = typeof navigator === 'undefined' ? 'zh-CN' : navigator.language;
  if (/^zh-(TW|HK|MO)/i.test(language)) return 'zh-TW';
  if (!/^zh/i.test(language)) return 'en';
  return 'zh-CN';
}

function applyDocumentLocale(locale: Locale): void {
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
}

applyDocumentLocale(currentLocale);

export function setLocale(locale: Locale): void {
  if (!SUPPORTED.includes(locale) || locale === currentLocale) return;
  currentLocale = locale;
  applyDocumentLocale(locale);
  try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* preference storage is optional */ }
  listeners.forEach((listener) => listener());
}

export function getLocale(): Locale { return currentLocale; }

export function hasExplicitTranslation(source: string, locale: Exclude<Locale, 'zh-CN'>): boolean {
  return locale === 'zh-TW' ? source in zhTW : source in en || source in enLaunch;
}

export function translate(source: string, values: Record<string, string | number> = {}, locale = currentLocale): string {
  const template = locale === 'zh-CN'
    ? source
    : locale === 'zh-TW'
      ? zhTW[source] ?? source
      : en[source] ?? enLaunch[source] ?? source;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? `{{${key}}}`));
}

export function useI18n() {
  const locale = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => currentLocale,
    () => 'zh-CN' as Locale,
  );
  return { locale, setLocale, t: (source: string, values?: Record<string, string | number>) => translate(source, values, locale) };
}
