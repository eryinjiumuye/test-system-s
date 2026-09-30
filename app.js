// ==========================================
// Supabaseの設定
// ==========================================

// ここに自分のSupabaseの情報を入れます。

const SUPABASE_URL = "https://yaxkvabopvindlbdzxpn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9TVmVas__w6DahDgshdEnw_hri2O_Ie";

let supabaseClient = null;


// ============================================================
// 状態
// ============================================================

let currentSubject = null;
let currentProblem = null;
let currentQuestion = null;

let adminSubject = null;
let adminProblem = null;
let editingQuestion = null;

let removeCurrentImage = false;


// ============================================================
// DOM
// ============================================================

let inviteScreen;
let subjectScreen;
let problemScreen;
let questionScreen;
let answerScreen;

let adminLoginScreen;
let adminArea;
let adminProblemScreen;
let adminQuestionScreen;
let adminQuestionEditor;


// ============================================================
// 初期化
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("app.js 読み込み開始");

    // DOMを取得
    getElements();

    // 先にボタンを有効化
    setupEvents();

    // Supabaseを初期化
    initializeSupabase();

});


// ============================================================
// DOM取得
// ============================================================

function getElements() {

    inviteScreen =
        document.getElementById("invite-screen");

    subjectScreen =
        document.getElementById("subject-screen");

    problemScreen =
        document.getElementById("problem-screen");

    questionScreen =
        document.getElementById("question-screen");

    answerScreen =
        document.getElementById("answer-screen");

    adminLoginScreen =
        document.getElementById("admin-login-screen");

    adminArea =
        document.getElementById("admin-area");

    adminProblemScreen =
        document.getElementById("admin-problem-screen");

    adminQuestionScreen =
        document.getElementById("admin-question-screen");

    adminQuestionEditor =
        document.getElementById("admin-question-editor");

}


// ============================================================
// Supabase初期化
// ============================================================

function initializeSupabase() {

    try {

        if (
            SUPABASE_URL.includes("ここに") ||
            SUPABASE_ANON_KEY.includes("ここに")
        ) {

            console.error(
                "SupabaseのURLまたはKeyが設定されていません。"
            );

            return;
        }


        if (!window.supabase) {

            console.error(
                "Supabaseのライブラリが読み込まれていません。"
            );

            return;
        }


        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );


        console.log("Supabase初期化成功");


        // 既にログインしている管理者がいるか確認
        checkAdminSession();


    } catch (error) {

        console.error(
            "Supabase初期化エラー:",
            error
        );

    }

}


// ============================================================
// イベント
// ============================================================

function setupEvents() {

    console.log("イベント設定開始");


    // ----------------------------------------
    // 招待コード
    // ----------------------------------------

    const inviteButton =
        document.getElementById("invite-button");

    if (inviteButton) {

        inviteButton.addEventListener(
            "click",
            enterWithInviteCode
        );

    }


    // Enterキーでも入室
    const inviteInput =
        document.getElementById("invite-code");

    if (inviteInput) {

        inviteInput.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    enterWithInviteCode();

                }

            }
        );

    }


    // ----------------------------------------
    // 管理者モード
    // ----------------------------------------

    const adminButton =
        document.getElementById("admin-button");

    if (adminButton) {

        adminButton.addEventListener(
            "click",
            openAdminLogin
        );

    }


    // ----------------------------------------
    // 管理者ログイン
    // ----------------------------------------

    const adminLoginButton =
        document.getElementById(
            "admin-login-button"
        );

    if (adminLoginButton) {

        adminLoginButton.addEventListener(
            "click",
            adminLogin
        );

    }


    const adminLoginBack =
        document.getElementById(
            "admin-login-back"
        );

    if (adminLoginBack) {

        adminLoginBack.addEventListener(
            "click",
            () => {

                adminLoginScreen.classList.add(
                    "hidden"
                );

                inviteScreen.classList.remove(
                    "hidden"
                );

            }
        );

    }


    // ----------------------------------------
    // 一般画面戻る
    // ----------------------------------------

    document
        .getElementById("back-to-subjects")
        ?.addEventListener(
            "click",
            () => showUserScreen(subjectScreen)
        );


    document
        .getElementById("back-to-problems")
        ?.addEventListener(
            "click",
            () => showUserScreen(problemScreen)
        );


    document
        .getElementById("back-to-questions")
        ?.addEventListener(
            "click",
            () => showUserScreen(questionScreen)
        );


    // ----------------------------------------
    // 管理者ログアウト
    // ----------------------------------------

    document
        .getElementById("logout-button")
        ?.addEventListener(
            "click",
            logoutAdmin
        );


    // ----------------------------------------
    // 科目
    // ----------------------------------------

    document
        .getElementById("add-subject-button")
        ?.addEventListener(
            "click",
            addSubject
        );


    // ----------------------------------------
    // 大問
    // ----------------------------------------

    document
        .getElementById("admin-back-subjects")
        ?.addEventListener(
            "click",
            () => {

                adminProblemScreen.classList.add(
                    "hidden"
                );

                document
                    .getElementById(
                        "admin-subject-screen"
                    )
                    .classList.remove(
                        "hidden"
                    );

                loadAdminSubjects();

            }
        );


    document
        .getElementById("add-problem-button")
        ?.addEventListener(
            "click",
            addProblem
        );


    // ----------------------------------------
    // 小問
    // ----------------------------------------

    document
        .getElementById("admin-back-problems")
        ?.addEventListener(
            "click",
            () => {

                adminQuestionScreen.classList.add(
                    "hidden"
                );

                adminProblemScreen.classList.remove(
                    "hidden"
                );

                loadAdminProblems(adminSubject);

            }
        );


    document
        .getElementById("add-question-button")
        ?.addEventListener(
            "click",
            () => openQuestionEditor(null)
        );


    // ----------------------------------------
    // 編集
    // ----------------------------------------

    document
        .getElementById("admin-editor-back")
        ?.addEventListener(
            "click",
            closeQuestionEditor
        );


    document
        .getElementById("cancel-question-button")
        ?.addEventListener(
            "click",
            closeQuestionEditor
        );


    document
        .getElementById("save-question-button")
        ?.addEventListener(
            "click",
            saveQuestion
        );


    document
        .getElementById("remove-image-button")
        ?.addEventListener(
            "click",
            markImageForRemoval
        );


    console.log("イベント設定完了");

}


// ============================================================
// 一般画面
// ============================================================

function hideAllUserScreens() {

    inviteScreen?.classList.add("hidden");
    subjectScreen?.classList.add("hidden");
    problemScreen?.classList.add("hidden");
    questionScreen?.classList.add("hidden");
    answerScreen?.classList.add("hidden");

}


function showUserScreen(screen) {

    hideAllUserScreens();

    screen?.classList.remove("hidden");

}


// ============================================================
// 招待コード
// ============================================================

async function enterWithInviteCode() {

    console.log("入室ボタンが押されました");

    const input =
        document.getElementById("invite-code");

    const error =
        document.getElementById("invite-error");

    const code =
        input.value.trim();

    error.textContent = "";


    // 現在の仮招待コード
    const INVITE_CODE = "1234";


    if (code !== INVITE_CODE) {

        error.textContent =
            "招待コードが正しくありません。";

        return;
    }


    // Supabaseがなくてもコード確認自体は動く
    await loadSubjects();

}


// ============================================================
// 科目
// ============================================================

async function loadSubjects() {

    if (!supabaseClient) {

        document
            .getElementById("invite-error")
            .textContent =
            "Supabaseに接続できていません。app.jsのURLとKeyを確認してください。";

        return;
    }


    const list =
        document.getElementById(
            "subject-list"
        );

    list.innerHTML =
        "読み込み中...";


    const {
        data,
        error
    } = await supabaseClient
        .from("subjects")
        .select("*")
        .order(
            "sort_order",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "科目取得エラー:",
            error
        );

        list.innerHTML =
            "科目の読み込みに失敗しました。";

        alert(
            "Supabaseから科目を取得できませんでした。\n\n" +
            error.message
        );

        return;
    }


    list.innerHTML = "";


    if (!data || data.length === 0) {

        list.innerHTML =
            "登録されている科目がありません。";

    }


    data.forEach(subject => {

        const card =
            document.createElement("div");

        card.className =
            "card";


        const title =
            document.createElement("div");

        title.className =
            "card-title";

        title.textContent =
            subject.name;


        card.appendChild(title);


        card.addEventListener(
            "click",
            () => {

                currentSubject =
                    subject;

                loadProblems(subject);

            }
        );


        list.appendChild(card);

    });


    showUserScreen(subjectScreen);

}


// ============================================================
// 大問
// ============================================================

async function loadProblems(subject) {

    const list =
        document.getElementById(
            "problem-list"
        );


    document.getElementById(
        "problem-title"
    ).textContent =
        `${subject.name}：大問を選択`;


    list.innerHTML =
        "読み込み中...";


    const {
        data,
        error
    } = await supabaseClient
        .from("problems")
        .select("*")
        .eq(
            "subject_id",
            subject.id
        )
        .order(
            "sort_order",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(error);

        list.innerHTML =
            "大問の読み込みに失敗しました。";

        return;
    }


    list.innerHTML = "";


    data.forEach(problem => {

        const card =
            document.createElement("div");

        card.className =
            "card";


        const title =
            document.createElement("div");

        title.className =
            "card-title";

        title.textContent =
            problem.name;


        card.appendChild(title);


        card.addEventListener(
            "click",
            () => {

                currentProblem =
                    problem;

                loadQuestions(problem);

            }
        );


        list.appendChild(card);

    });


    showUserScreen(problemScreen);

}


// ============================================================
// 小問
// ============================================================

async function loadQuestions(problem) {

    const list =
        document.getElementById(
            "question-list"
        );


    document.getElementById(
        "question-title"
    ).textContent =
        `${problem.name}：小問を選択`;


    list.innerHTML =
        "読み込み中...";


    const {
        data,
        error
    } = await supabaseClient
        .from("questions")
        .select("*")
        .eq(
            "problem_id",
            problem.id
        )
        .order(
            "sort_order",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(error);

        list.innerHTML =
            "小問の読み込みに失敗しました。";

        return;
    }


    list.innerHTML = "";


    data.forEach(question => {

        const card =
            document.createElement("div");

        card.className =
            "card";


        const title =
            document.createElement("div");

        title.className =
            "card-title";

        title.textContent =
            question.name;


        card.appendChild(title);


        card.addEventListener(
            "click",
            () => {

                currentQuestion =
                    question;

                showAnswer(question);

            }
        );


        list.appendChild(card);

    });


    showUserScreen(questionScreen);

}


// ============================================================
// 解答
// ============================================================

function showAnswer(question) {

    document.getElementById(
        "breadcrumb"
    ).textContent =
        `${currentSubject.name} ＞ ${currentProblem.name} ＞ ${question.name}`;


    document.getElementById(
        "answer-question-name"
    ).textContent =
        question.name;


    document.getElementById(
        "answer-problem"
    ).textContent =
        question.problem ||
        "問題文がありません。";


    document.getElementById(
        "answer-answer"
    ).textContent =
        question.answer ||
        "答えがありません。";


    document.getElementById(
        "answer-explanation"
    ).textContent =
        question.explanation ||
        "解説がありません。";


    const imageSection =
        document.getElementById(
            "answer-image-section"
        );

    const image =
        document.getElementById(
            "answer-image"
        );


    if (question.image_url) {

        image.src =
            question.image_url;

        imageSection.classList.remove(
            "hidden"
        );

    } else {

        image.src = "";

        imageSection.classList.add(
            "hidden"
        );

    }


    showUserScreen(answerScreen);

}


// ============================================================
// 管理者ログイン画面
// ============================================================

function openAdminLogin() {

    console.log(
        "管理者モードが押されました"
    );


    hideAllUserScreens();


    adminArea.classList.add(
        "hidden"
    );


    adminLoginScreen.classList.remove(
        "hidden"
    );

}


// ============================================================
// 管理者ログイン
// ============================================================

async function adminLogin() {

    const email =
        document.getElementById(
            "admin-email"
        ).value.trim();


    const password =
        document.getElementById(
            "admin-password"
        ).value;


    const errorElement =
        document.getElementById(
            "admin-login-error"
        );


    errorElement.textContent = "";


    if (!supabaseClient) {

        errorElement.textContent =
            "Supabaseが初期化されていません。";

        return;
    }


    if (!email || !password) {

        errorElement.textContent =
            "メールアドレスとパスワードを入力してください。";

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient.auth
            .signInWithPassword({
                email,
                password
            });


    if (error) {

        console.error(
            "ログインエラー:",
            error
        );

        errorElement.textContent =
            "ログインに失敗しました："
            + error.message;

        return;
    }


    const isAdmin =
        await checkIsAdmin(
            data.user.id
        );


    if (!isAdmin) {

        await supabaseClient.auth.signOut();


        errorElement.textContent =
            "このアカウントには管理者権限がありません。";

        return;
    }


    openAdminArea(
        data.user
    );

}


// ============================================================
// 管理者確認
// ============================================================

async function checkIsAdmin(userId) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("admin_users")
            .select("user_id")
            .eq(
                "user_id",
                userId
            )
            .maybeSingle();


    if (error) {

        console.error(
            "管理者確認エラー:",
            error
        );

        return false;
    }


    return !!data;

}


// ============================================================
// セッション
// ============================================================

async function checkAdminSession() {

    if (!supabaseClient) {
        return;
    }


    const {
        data
    } =
        await supabaseClient.auth
            .getSession();


    const session =
        data.session;


    if (!session) {
        return;
    }


    const isAdmin =
        await checkIsAdmin(
            session.user.id
        );


    if (isAdmin) {

        openAdminArea(
            session.user
        );

    }

}


// ============================================================
// 管理者画面
// ============================================================

function openAdminArea(user) {

    hideAllUserScreens();


    adminLoginScreen.classList.add(
        "hidden"
    );


    adminArea.classList.remove(
        "hidden"
    );


    document.getElementById(
        "admin-email-display"
    ).textContent =
        user.email || "";


    document
        .getElementById(
            "admin-subject-screen"
        )
        .classList.remove(
            "hidden"
        );


    adminProblemScreen.classList.add(
        "hidden"
    );

    adminQuestionScreen.classList.add(
        "hidden"
    );

    adminQuestionEditor.classList.add(
        "hidden"
    );


    loadAdminSubjects();

}


// ============================================================
// ログアウト
// ============================================================

async function logoutAdmin() {

    if (supabaseClient) {

        await supabaseClient.auth.signOut();

    }


    adminArea.classList.add(
        "hidden"
    );


    adminLoginScreen.classList.add(
        "hidden"
    );


    inviteScreen.classList.remove(
        "hidden"
    );

}


// ============================================================
// 管理者：科目
// ============================================================

async function loadAdminSubjects() {

    const list =
        document.getElementById(
            "admin-subject-list"
        );


    list.innerHTML =
        "読み込み中...";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("subjects")
            .select("*")
            .order(
                "sort_order",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        list.innerHTML =
            "科目の読み込みに失敗しました。";

        return;
    }


    list.innerHTML = "";


    data.forEach(subject => {

        const item =
            createAdminItem(
                subject.name,
                [
                    {
                        text: "開く",

                        action: () => {

                            adminSubject =
                                subject;

                            loadAdminProblems(
                                subject
                            );

                        }
                    },

                    {
                        text: "名前変更",

                        action: () =>
                            renameSubject(
                                subject
                            )
                    },

                    {
                        text: "削除",

                        danger: true,

                        action: () =>
                            deleteSubject(
                                subject
                            )
                    }
                ]
            );


        list.appendChild(item);

    });

}


// ============================================================
// 科目追加
// ============================================================

async function addSubject() {

    const name =
        prompt(
            "新しい科目名を入力してください。"
        );


    if (!name || !name.trim()) {
        return;
    }


    const {
        data: existing
    } =
        await supabaseClient
            .from("subjects")
            .select("sort_order")
            .order(
                "sort_order",
                {
                    ascending: false
                }
            )
            .limit(1);


    const sortOrder =
        existing &&
        existing.length
            ? existing[0].sort_order + 1
            : 1;


    const {
        error
    } =
        await supabaseClient
            .from("subjects")
            .insert({
                name: name.trim(),
                sort_order: sortOrder
            });


    if (error) {

        alert(
            "科目の追加に失敗しました。\n" +
            error.message
        );

        return;
    }


    loadAdminSubjects();

}


// ============================================================
// 科目変更
// ============================================================

async function renameSubject(subject) {

    const name =
        prompt(
            "新しい科目名を入力してください。",
            subject.name
        );


    if (!name || !name.trim()) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("subjects")
            .update({
                name: name.trim()
            })
            .eq(
                "id",
                subject.id
            );


    if (error) {

        alert(
            "名前変更に失敗しました。\n" +
            error.message
        );

        return;
    }


    loadAdminSubjects();

}


// ============================================================
// 科目削除
// ============================================================

async function deleteSubject(subject) {

    const ok =
        confirm(
            `「${subject.name}」を削除しますか？\n\n` +
            "この科目に含まれる大問・小問も削除されます。"
        );


    if (!ok) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("subjects")
            .delete()
            .eq(
                "id",
                subject.id
            );


    if (error) {

        alert(
            "削除に失敗しました。\n" +
            error.message
        );

        return;
    }


    loadAdminSubjects();

}


// ============================================================
// 管理者：大問
// ============================================================

async function loadAdminProblems(subject) {

    adminSubject =
        subject;


    document
        .getElementById(
            "admin-subject-screen"
        )
        .classList.add(
            "hidden"
        );


    adminQuestionScreen.classList.add(
        "hidden"
    );


    adminQuestionEditor.classList.add(
        "hidden"
    );


    adminProblemScreen.classList.remove(
        "hidden"
    );


    document.getElementById(
        "admin-problem-title"
    ).textContent =
        `${subject.name}：大問管理`;


    const list =
        document.getElementById(
            "admin-problem-list"
        );


    list.innerHTML =
        "読み込み中...";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("problems")
            .select("*")
            .eq(
                "subject_id",
                subject.id
            )
            .order(
                "sort_order",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        list.innerHTML =
            "大問の読み込みに失敗しました。";

        return;
    }


    list.innerHTML = "";


    data.forEach(problem => {

        const item =
            createAdminItem(
                problem.name,
                [
                    {
                        text: "開く",

                        action: () => {

                            adminProblem =
                                problem;

                            loadAdminQuestions(
                                problem
                            );

                        }
                    },

                    {
                        text: "名前変更",

                        action: () =>
                            renameProblem(
                                problem
                            )
                    },

                    {
                        text: "削除",

                        danger: true,

                        action: () =>
                            deleteProblem(
                                problem
                            )
                    }
                ]
            );


        list.appendChild(item);

    });

}


// ============================================================
// 大問追加
// ============================================================

async function addProblem() {

    if (!adminSubject) {
        return;
    }


    const name =
        prompt(
            "大問名を入力してください。"
        );


    if (!name || !name.trim()) {
        return;
    }


    const {
        data: existing
    } =
        await supabaseClient
            .from("problems")
            .select("sort_order")
            .eq(
                "subject_id",
                adminSubject.id
            )
            .order(
                "sort_order",
                {
                    ascending: false
                }
            )
            .limit(1);


    const sortOrder =
        existing &&
        existing.length
            ? existing[0].sort_order + 1
            : 1;


    const {
        error
    } =
        await supabaseClient
            .from("problems")
            .insert({
                subject_id:
                    adminSubject.id,

                name:
                    name.trim(),

                sort_order:
                    sortOrder
            });


    if (error) {

        alert(
            "大問の追加に失敗しました。\n" +
            error.message
        );

        return;
    }


    loadAdminProblems(
        adminSubject
    );

}


// ============================================================
// 大問変更
// ============================================================

async function renameProblem(problem) {

    const name =
        prompt(
            "新しい大問名を入力してください。",
            problem.name
        );


    if (!name || !name.trim()) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("problems")
            .update({
                name:
                    name.trim()
            })
            .eq(
                "id",
                problem.id
            );


    if (error) {

        alert(
            "名前変更に失敗しました。\n" +
            error.message
        );

        return;
    }


    loadAdminProblems(
        adminSubject
    );

}


// ============================================================
// 大問削除
// ============================================================

async function deleteProblem(problem) {

    const ok =
        confirm(
            `「${problem.name}」を削除しますか？\n\n` +
            "この大問に含まれる小問も削除されます。"
        );


    if (!ok) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("problems")
            .delete()
            .eq(
                "id",
                problem.id
            );


    if (error) {

        alert(
            "削除に失敗しました。\n" +
            error.message
        );

        return;
    }


    loadAdminProblems(
        adminSubject
    );

}


// ============================================================
// 小問
// ============================================================

async function loadAdminQuestions(problem) {

    adminProblem =
        problem;


    adminProblemScreen.classList.add(
        "hidden"
    );


    adminQuestionEditor.classList.add(
        "hidden"
    );


    adminQuestionScreen.classList.remove(
        "hidden"
    );


    document.getElementById(
        "admin-question-title"
    ).textContent =
        `${problem.name}：小問管理`;


    const list =
        document.getElementById(
            "admin-question-list"
        );


    list.innerHTML =
        "読み込み中...";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("questions")
            .select("*")
            .eq(
                "problem_id",
                problem.id
            )
            .order(
                "sort_order",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        list.innerHTML =
            "小問の読み込みに失敗しました。";

        return;
    }


    list.innerHTML = "";


    data.forEach(question => {

        const item =
            createAdminItem(
                question.name,
                [
                    {
                        text: "編集",

                        action: () =>
                            openQuestionEditor(
                                question
                            )
                    },

                    {
                        text: "削除",

                        danger: true,

                        action: () =>
                            deleteQuestion(
                                question
                            )
                    }
                ]
            );


        list.appendChild(item);

    });

}


// ============================================================
// 小問編集
// ============================================================

function openQuestionEditor(question) {

    editingQuestion =
        question;

    removeCurrentImage =
        false;


    adminQuestionEditor.classList.remove(
        "hidden"
    );


    adminQuestionScreen.classList.add(
        "hidden"
    );


    document.getElementById(
        "editor-title"
    ).textContent =
        question
            ? "小問を編集"
            : "小問を追加";


    document.getElementById(
        "edit-question-name"
    ).value =
        question?.name || "";


    document.getElementById(
        "edit-question-problem"
    ).value =
        question?.problem || "";


    document.getElementById(
        "edit-question-answer"
    ).value =
        question?.answer || "";


    document.getElementById(
        "edit-question-explanation"
    ).value =
        question?.explanation || "";


    document.getElementById(
        "edit-question-image-file"
    ).value = "";


    showCurrentImage(
        question
    );

}


// ============================================================
// 現在画像
// ============================================================

function showCurrentImage(question) {

    const area =
        document.getElementById(
            "current-image-area"
        );


    const removeButton =
        document.getElementById(
            "remove-image-button"
        );


    area.innerHTML = "";


    removeButton.classList.add(
        "hidden"
    );


    if (
        !question ||
        !question.image_url
    ) {

        return;

    }


    const label =
        document.createElement(
            "div"
        );


    label.className =
        "current-image-label";


    label.textContent =
        "現在登録されている画像";


    const img =
        document.createElement(
            "img"
        );


    img.src =
        question.image_url;


    img.alt =
        "現在の問題画像";


    area.appendChild(label);

    area.appendChild(img);


    removeButton.classList.remove(
        "hidden"
    );

}


// ============================================================
// 画像削除
// ============================================================

function markImageForRemoval() {

    if (!editingQuestion) {
        return;
    }


    const ok =
        confirm(
            "現在の画像を削除しますか？"
        );


    if (!ok) {
        return;
    }


    removeCurrentImage =
        true;


    document.getElementById(
        "current-image-area"
    ).innerHTML =
        `<div class="current-image-label">
            保存すると画像が削除されます。
        </div>`;


    document
        .getElementById(
            "remove-image-button"
        )
        .classList.add(
            "hidden"
        );

}


// ============================================================
// 小問保存
// ============================================================

async function saveQuestion() {

    if (!adminProblem) {

        alert(
            "大問が選択されていません。"
        );

        return;
    }


    const name =
        document
            .getElementById(
                "edit-question-name"
            )
            .value
            .trim();


    const problem =
        document.getElementById(
            "edit-question-problem"
        ).value;


    const answer =
        document.getElementById(
            "edit-question-answer"
        ).value;


    const explanation =
        document.getElementById(
            "edit-question-explanation"
        ).value;


    const fileInput =
        document.getElementById(
            "edit-question-image-file"
        );


    const file =
        fileInput.files[0];


    if (!name) {

        alert(
            "小問名を入力してください。"
        );

        return;
    }


    // ----------------------------------------
    // 既存画像
    // ----------------------------------------

    let imageUrl =
        editingQuestion?.image_url ||
        null;


    let imagePath =
        editingQuestion?.image_path ||
        null;


    // ----------------------------------------
    // 画像形式
    // ----------------------------------------

    if (file) {

        if (!file.type.startsWith("image/")) {

            alert(
                "画像ファイルを選択してください。"
            );

            return;
        }


        if (
            file.size >
            10 * 1024 * 1024
        ) {

            alert(
                "画像サイズは10MB以下にしてください。"
            );

            return;
        }

    }


    // ========================================================
    // 新規小問
    // ========================================================

    if (!editingQuestion) {

        const sortOrder =
            await getNextQuestionSortOrder();


        const {
            data: newQuestion,
            error: insertError
        } =
            await supabaseClient
                .from("questions")
                .insert({
                    problem_id:
                        adminProblem.id,

                    name,

                    problem,

                    answer,

                    explanation,

                    image_url:
                        null,

                    image_path:
                        null,

                    sort_order:
                        sortOrder
                })
                .select()
                .single();


        if (insertError) {

            console.error(
                insertError
            );

            alert(
                "小問の追加に失敗しました。\n" +
                insertError.message
            );

            return;
        }


        // 新しい画像をアップロード
        if (file) {

            const extension =
                getFileExtension(file);


            const filePath =
                `questions/${newQuestion.id}-${Date.now()}.${extension}`;


            const {
                data: uploadData,
                error: uploadError
            } =
                await supabaseClient
                    .storage
                    .from("test-images")
                    .upload(
                        filePath,
                        file,
                        {
                            contentType:
                                file.type,

                            cacheControl:
                                "3600",

                            upsert:
                                false
                        }
                    );


            if (uploadError) {

                console.error(
                    uploadError
                );


                await supabaseClient
                    .from("questions")
                    .delete()
                    .eq(
                        "id",
                        newQuestion.id
                    );


                alert(
                    "画像のアップロードに失敗したため、" +
                    "小問の作成を取り消しました。\n\n" +
                    uploadError.message
                );

                return;
            }


            const {
                data: publicData
            } =
                supabaseClient
                    .storage
                    .from("test-images")
                    .getPublicUrl(
                        uploadData.path
                    );


            imageUrl =
                publicData.publicUrl;


            imagePath =
                uploadData.path;


            const {
                error: updateError
            } =
                await supabaseClient
                    .from("questions")
                    .update({
                        image_url:
                            imageUrl,

                        image_path:
                            imagePath
                    })
                    .eq(
                        "id",
                        newQuestion.id
                    );


            if (updateError) {

                console.error(
                    updateError
                );


                await supabaseClient
                    .storage
                    .from("test-images")
                    .remove([
                        imagePath
                    ]);


                await supabaseClient
                    .from("questions")
                    .delete()
                    .eq(
                        "id",
                        newQuestion.id
                    );


                alert(
                    "画像情報の保存に失敗しました。"
                );

                return;
            }

        }


        alert(
            "小問を追加しました。"
        );


        await loadAdminQuestions(
            adminProblem
        );


        return;
    }


    // ========================================================
    // 既存小問
    // ========================================================

    // 画像削除
    if (
        removeCurrentImage &&
        imagePath
    ) {

        const {
            error: deleteError
        } =
            await supabaseClient
                .storage
                .from("test-images")
                .remove([
                    imagePath
                ]);


        if (deleteError) {

            console.error(
                deleteError
            );


            alert(
                "画像の削除に失敗しました。\n" +
                deleteError.message
            );

            return;
        }


        imageUrl =
            null;

        imagePath =
            null;

    }


    // ----------------------------------------
    // 新画像
    // ----------------------------------------

    if (file) {

        const extension =
            getFileExtension(file);


        const newFilePath =
            `questions/${editingQuestion.id}-${Date.now()}.${extension}`;


        const {
            data: uploadData,
            error: uploadError
        } =
            await supabaseClient
                .storage
                .from("test-images")
                .upload(
                    newFilePath,
                    file,
                    {
                        contentType:
                            file.type,

                        cacheControl:
                            "3600",

                        upsert:
                            false
                    }
                );


        if (uploadError) {

            console.error(
                uploadError
            );


            alert(
                "画像のアップロードに失敗しました。\n" +
                uploadError.message
            );

            return;
        }


        const {
            data: publicData
        } =
            supabaseClient
                .storage
                .from("test-images")
                .getPublicUrl(
                    uploadData.path
                );


        imageUrl =
            publicData.publicUrl;


        imagePath =
            uploadData.path;


        // 古い画像削除
        if (
            editingQuestion.image_path &&
            editingQuestion.image_path !==
            newFilePath
        ) {

            const {
                error:
                    oldDeleteError
            } =
                await supabaseClient
                    .storage
                    .from("test-images")
                    .remove([
                        editingQuestion.image_path
                    ]);


            if (oldDeleteError) {

                console.warn(
                    "古い画像を削除できませんでした。",
                    oldDeleteError
                );

            }

        }

    }


    // ----------------------------------------
    // DB更新
    // ----------------------------------------

    const {
        error
    } =
        await supabaseClient
            .from("questions")
            .update({
                name,

                problem,

                answer,

                explanation,

                image_url:
                    imageUrl,

                image_path:
                    imagePath,

                updated_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                editingQuestion.id
            );


    if (error) {

        console.error(
            error
        );

        alert(
            "小問の保存に失敗しました。\n" +
            error.message
        );

        return;
    }


    alert(
        "保存しました。"
    );


    editingQuestion =
        null;

    removeCurrentImage =
        false;


    await loadAdminQuestions(
        adminProblem
    );

}


// ============================================================
// 小問並び順
// ============================================================

async function getNextQuestionSortOrder() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("questions")
            .select("sort_order")
            .eq(
                "problem_id",
                adminProblem.id
            )
            .order(
                "sort_order",
                {
                    ascending: false
                }
            )
            .limit(1);


    if (error) {

        console.error(
            error
        );

        return 1;
    }


    if (
        !data ||
        data.length === 0
    ) {

        return 1;

    }


    return (
        data[0].sort_order + 1
    );

}


// ============================================================
// 小問削除
// ============================================================

async function deleteQuestion(question) {

    const ok =
        confirm(
            `「${question.name}」を削除しますか？`
        );


    if (!ok) {
        return;
    }


    // 画像削除
    if (question.image_path) {

        const {
            error: imageError
        } =
            await supabaseClient
                .storage
                .from("test-images")
                .remove([
                    question.image_path
                ]);


        if (imageError) {

            console.warn(
                "画像削除エラー:",
                imageError
            );

        }

    }


    // DB削除
    const {
        error
    } =
        await supabaseClient
            .from("questions")
            .delete()
            .eq(
                "id",
                question.id
            );


    if (error) {

        alert(
            "小問の削除に失敗しました。\n" +
            error.message
        );

        return;
    }


    loadAdminQuestions(
        adminProblem
    );

}


// ============================================================
// 編集画面終了
// ============================================================

function closeQuestionEditor() {

    editingQuestion =
        null;

    removeCurrentImage =
        false;


    adminQuestionEditor.classList.add(
        "hidden"
    );


    adminQuestionScreen.classList.remove(
        "hidden"
    );

}


// ============================================================
// 管理者リスト
// ============================================================

function createAdminItem(
    name,
    buttons
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "admin-item";


    const nameElement =
        document.createElement(
            "div"
        );


    nameElement.className =
        "admin-item-name";


    nameElement.textContent =
        name;


    const buttonArea =
        document.createElement(
            "div"
        );


    buttonArea.className =
        "admin-item-buttons";


    buttons.forEach(
        buttonInfo => {

            const button =
                document.createElement(
                    "button"
                );


            button.textContent =
                buttonInfo.text;


            if (
                buttonInfo.danger
            ) {

                button.classList.add(
                    "danger-button"
                );

            }


            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    buttonInfo.action();

                }
            );


            buttonArea.appendChild(
                button
            );

        }
    );


    item.appendChild(
        nameElement
    );


    item.appendChild(
        buttonArea
    );


    return item;

}


// ============================================================
// 拡張子
// ============================================================

function getFileExtension(file) {

    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    if (
        extension === "jpg" ||
        extension === "jpeg" ||
        extension === "png" ||
        extension === "webp"
    ) {

        return extension;

    }


    if (
        file.type ===
        "image/png"
    ) {

        return "png";

    }


    if (
        file.type ===
        "image/webp"
    ) {

        return "webp";

    }


    return "jpg";

}