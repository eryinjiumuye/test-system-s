// ==========================================
// Supabaseの設定
// ==========================================

// ここに自分のSupabaseの情報を入れます。

const SUPABASE_URL = "https://yaxkvabopvindlbdzxpn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9TVmVas__w6DahDgshdEnw_hri2O_Ie";

let supabaseClient = null;


// ============================================================
// 招待コード
// ============================================================

const INVITE_CODE = "1234";


// ============================================================
// 状態
// ============================================================

let currentSubject = null;
let currentProblem = null;
let currentQuestion = null;

let adminSubject = null;
let adminProblem = null;
let editingQuestion = null;


// ============================================================
// 初期化
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("app.js 読み込み開始");

    setupEvents();

    initializeSupabase();

});


// ============================================================
// イベント設定
// ============================================================

function setupEvents() {

    console.log("イベント設定開始");


    // 入室
    document
        .getElementById("enter-button")
        .addEventListener("click", enterSystem);


    // 管理者モード
    document
        .getElementById("admin-button")
        .addEventListener("click", openAdminLogin);


    // 戻る
    document
        .getElementById("problem-back")
        .addEventListener("click", () => {

            showSubjects();

        });


    document
        .getElementById("question-back")
        .addEventListener("click", () => {

            showProblems(currentSubject);

        });


    document
        .getElementById("answer-back")
        .addEventListener("click", () => {

            showQuestions(currentProblem);

        });


    // ご要望
    document
        .getElementById("request-button")
        .addEventListener("click", openRequestScreen);


    document
        .getElementById("request-cancel")
        .addEventListener("click", () => {

            showQuestions(currentProblem);

        });


    document
        .getElementById("request-submit")
        .addEventListener("click", submitRequest);


    // 管理者ログイン
    document
        .getElementById("admin-login-button")
        .addEventListener("click", adminLogin);


    document
        .getElementById("admin-login-back")
        .addEventListener("click", () => {

            showScreen("entry-screen");

        });


    document
        .getElementById("admin-logout-button")
        .addEventListener("click", adminLogout);


    // 管理者メニュー
    document
        .getElementById("admin-subject-menu")
        .addEventListener("click", () => {

            renderAdminSubjects();

        });


    document
        .getElementById("admin-problem-menu")
        .addEventListener("click", () => {

            renderAdminProblems();

        });


    document
        .getElementById("admin-question-menu")
        .addEventListener("click", () => {

            renderAdminQuestions();

        });


    document
        .getElementById("admin-request-menu")
        .addEventListener("click", () => {

            renderAdminRequests();

        });


    // Enterキー
    document
        .getElementById("invite-code")
        .addEventListener("keydown", event => {

            if (event.key === "Enter") {

                enterSystem();

            }

        });


    document
        .getElementById("admin-password")
        .addEventListener("keydown", event => {

            if (event.key === "Enter") {

                adminLogin();

            }

        });


    console.log("イベント設定完了");

}


// ============================================================
// Supabase初期化
// ============================================================

function initializeSupabase() {

    try {

        if (
            typeof SUPABASE_URL === "undefined" ||
            typeof SUPABASE_ANON_KEY === "undefined"
        ) {

            throw new Error(
                "Supabaseの設定が見つかりません。"
            );

        }


        if (
            SUPABASE_URL.includes("ここに") ||
            SUPABASE_ANON_KEY.includes("ここに")
        ) {

            throw new Error(
                "app.jsのSupabase設定を入力してください。"
            );

        }


        if (
            !window.supabase ||
            !window.supabase.createClient
        ) {

            throw new Error(
                "Supabaseライブラリを読み込めませんでした。"
            );

        }


        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );


        console.log("Supabase初期化成功");

    }

    catch (error) {

        console.error(
            "Supabase初期化エラー:",
            error
        );

    }

}


// ============================================================
// 画面切り替え
// ============================================================

function showScreen(screenId) {

    document
        .querySelectorAll(".screen")
        .forEach(screen => {

            screen.classList.remove("active");

        });


    const target =
        document.getElementById(screenId);


    if (target) {

        target.classList.add("active");

    }

}


// ============================================================
// 入室
// ============================================================

async function enterSystem() {

    const code =
        document
            .getElementById("invite-code")
            .value
            .trim();


    const error =
        document.getElementById("entry-error");


    error.textContent = "";


    if (code !== INVITE_CODE) {

        error.textContent =
            "招待コードが正しくありません。";

        return;

    }


    if (!supabaseClient) {

        error.textContent =
            "データベースに接続できません。";

        return;

    }


    await showSubjects();

}


// ============================================================
// 科目一覧
// ============================================================

async function showSubjects() {

    showScreen("subject-screen");


    const list =
        document.getElementById("subject-list");


    list.innerHTML =
        "<p>読み込み中...</p>";


    const { data, error } =
        await supabaseClient

            .from("subjects")

            .select("*")

            .order(
                "sort_order",
                {
                    ascending: true
                }
            )

            .order(
                "id",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        list.innerHTML =
            "<p class='error'>科目を読み込めませんでした。</p>";

        return;

    }


    list.innerHTML = "";


    if (!data || data.length === 0) {

        list.innerHTML =
            "<p>科目がありません。</p>";

        return;

    }


    data.forEach(subject => {

        const button =
            document.createElement("button");


        button.textContent =
            subject.name;


        button.addEventListener(
            "click",
            () => {

                currentSubject =
                    subject;

                showProblems(subject);

            }
        );


        list.appendChild(button);

    });

}


// ============================================================
// 大問一覧
// ============================================================

async function showProblems(subject) {

    currentSubject =
        subject;


    showScreen("problem-screen");


    document
        .getElementById("problem-title")
        .textContent =
            `${subject.name}：大問を選択`;


    const list =
        document.getElementById("problem-list");


    list.innerHTML =
        "<p>読み込み中...</p>";


    const { data, error } =
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
            )

            .order(
                "id",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        list.innerHTML =
            "<p class='error'>大問を読み込めませんでした。</p>";

        return;

    }


    list.innerHTML = "";


    if (!data || data.length === 0) {

        list.innerHTML =
            "<p>大問がありません。</p>";

        return;

    }


    data.forEach(problem => {

        const button =
            document.createElement("button");


        button.textContent =
            problem.name;


        button.addEventListener(
            "click",
            () => {

                currentProblem =
                    problem;

                showQuestions(problem);

            }
        );


        list.appendChild(button);

    });

}


// ============================================================
// 小問一覧
// ============================================================

async function showQuestions(problem) {

    currentProblem =
        problem;


    showScreen("question-screen");


    document
        .getElementById("question-title")
        .textContent =
            `${currentSubject.name} ＞ ${problem.name}`;


    const list =
        document.getElementById("question-list");


    list.innerHTML =
        "<p>読み込み中...</p>";


    const { data, error } =
        await supabaseClient

            .from("questions")

            .select(
                "id, name, problem_id, sort_order"
            )

            .eq(
                "problem_id",
                problem.id
            )

            .order(
                "sort_order",
                {
                    ascending: true
                }
            )

            .order(
                "id",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        list.innerHTML =
            "<p class='error'>小問を読み込めませんでした。</p>";

        return;

    }


    list.innerHTML = "";


    if (!data || data.length === 0) {

        list.innerHTML =
            "<p>小問がありません。</p>";

    }

    else {

        data.forEach(question => {

            const button =
                document.createElement("button");


            button.textContent =
                question.name;


            button.addEventListener(
                "click",
                () => {

                    showAnswer(question.id);

                }
            );


            list.appendChild(button);

        });

    }

}


// ============================================================
// 解答表示
// ============================================================

async function showAnswer(questionId) {

    const { data, error } =
        await supabaseClient

            .from("questions")

            .select("*")

            .eq(
                "id",
                questionId
            )

            .single();


    if (error) {

        console.error(error);

        alert(
            "解答を読み込めませんでした。"
        );

        return;

    }


    currentQuestion =
        data;


    showScreen("answer-screen");


    document
        .getElementById("answer-breadcrumb")
        .textContent =
            `${currentSubject.name} ＞ ${currentProblem.name} ＞ ${data.name}`;


    document
        .getElementById("answer-question-name")
        .textContent =
            data.name;


    // ========================================================
    // 重要
    // 問題文・解説・画像は表示しない
    // 解答だけを表示する
    // ========================================================

    document
        .getElementById("answer-text")
        .textContent =
            data.answer ||
            "解答が登録されていません。";

}


// ============================================================
// ご要望画面
// ============================================================

function openRequestScreen() {

    if (
        !currentSubject ||
        !currentProblem
    ) {

        return;

    }


    showScreen("request-screen");


    document
        .getElementById("request-breadcrumb")
        .textContent =
            `${currentSubject.name} ＞ ${currentProblem.name}`;


    document
        .getElementById("request-message")
        .value = "";


    document
        .getElementById("request-result")
        .textContent = "";

}


// ============================================================
// ご要望送信
// ============================================================

async function submitRequest() {

    const message =
        document
            .getElementById("request-message")
            .value
            .trim();


    const result =
        document
            .getElementById("request-result");


    const button =
        document
            .getElementById("request-submit");


    result.textContent = "";


    if (!message) {

        result.textContent =
            "内容を入力してください。";

        result.style.color =
            "#b42318";

        return;

    }


    if (message.length > 1000) {

        result.textContent =
            "1000文字以内で入力してください。";

        result.style.color =
            "#b42318";

        return;

    }


    button.disabled = true;

    button.textContent =
        "送信中...";


    const { error } =
        await supabaseClient

            .from("requests")

            .insert({

                subject_id:
                    currentSubject
                        ? currentSubject.id
                        : null,

                problem_id:
                    currentProblem
                        ? currentProblem.id
                        : null,

                question_id:
                    currentQuestion
                        ? currentQuestion.id
                        : null,

                message:
                    message,

                status:
                    "未確認"

            });


    button.disabled = false;

    button.textContent =
        "送信";


    if (error) {

        console.error(error);

        result.textContent =
            "送信できませんでした。もう一度試してください。";

        result.style.color =
            "#b42318";

        return;

    }


    result.textContent =
        "送信しました。ありがとうございます。";

    result.style.color =
        "#277043";


    setTimeout(
        () => {

            showQuestions(
                currentProblem
            );

        },
        1200
    );

}


// ============================================================
// 管理者ログイン画面
// ============================================================

function openAdminLogin() {

    showScreen(
        "admin-login-screen"
    );


    document
        .getElementById("admin-login-error")
        .textContent = "";

}


// ============================================================
// 管理者ログイン
// ============================================================

async function adminLogin() {

    const email =
        document
            .getElementById("admin-email")
            .value
            .trim();


    const password =
        document
            .getElementById("admin-password")
            .value;


    const errorBox =
        document
            .getElementById("admin-login-error");


    errorBox.textContent = "";


    if (!email || !password) {

        errorBox.textContent =
            "メールアドレスとパスワードを入力してください。";

        return;

    }


    if (!supabaseClient) {

        errorBox.textContent =
            "Supabaseに接続できません。";

        return;

    }


    const { error } =
        await supabaseClient.auth
            .signInWithPassword({

                email:
                    email,

                password:
                    password

            });


    if (error) {

        console.error(error);

        errorBox.textContent =
            "ログインできませんでした。";

        return;

    }


    const isAdmin =
        await checkAdmin();


    if (!isAdmin) {

        await supabaseClient.auth.signOut();


        errorBox.textContent =
            "このアカウントには管理者権限がありません。";

        return;

    }


    document
        .getElementById("admin-email")
        .value = "";


    document
        .getElementById("admin-password")
        .value = "";


    showScreen(
        "admin-screen"
    );


    renderAdminSubjects();

}


// ============================================================
// 管理者確認
// ============================================================

async function checkAdmin() {

    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth
            .getUser();


    if (!user) {

        return false;

    }


    const { data, error } =
        await supabaseClient

            .from("admin_users")

            .select("user_id")

            .eq(
                "user_id",
                user.id
            )

            .maybeSingle();


    if (error) {

        console.error(error);

        return false;

    }


    return !!data;

}


// ============================================================
// 管理者ログアウト
// ============================================================

async function adminLogout() {

    await supabaseClient.auth.signOut();

    showScreen(
        "entry-screen"
    );

}


// ============================================================
// 管理者：科目管理
// ============================================================

async function renderAdminSubjects() {

    const content =
        document
            .getElementById("admin-content");


    content.innerHTML = `

        <h2>科目管理</h2>

        <div class="admin-toolbar">

            <button
                id="add-subject-button"
                class="primary-button">

                ＋ 科目を追加

            </button>

        </div>

        <div
            id="admin-subject-list"
            class="admin-list">

            読み込み中...

        </div>

    `;


    document
        .getElementById(
            "add-subject-button"
        )
        .addEventListener(
            "click",
            addSubject
        );


    const { data, error } =
        await supabaseClient

            .from("subjects")

            .select("*")

            .order(
                "sort_order",
                {
                    ascending: true
                }
            )

            .order(
                "id",
                {
                    ascending: true
                }
            );


    const list =
        document
            .getElementById(
                "admin-subject-list"
            );


    if (error) {

        console.error(error);

        list.innerHTML =
            "<p class='error'>読み込みに失敗しました。</p>";

        return;

    }


    list.innerHTML = "";


    data.forEach(subject => {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "admin-row";


        row.innerHTML = `

            <div class="admin-row-main">

                <strong>
                    ${escapeHtml(subject.name)}
                </strong>

                <div class="admin-row-actions">

                    <button
                        class="secondary-button rename-button">

                        名前変更

                    </button>

                    <button
                        class="danger-button delete-button">

                        削除

                    </button>

                </div>

            </div>

        `;


        row
            .querySelector(
                ".rename-button"
            )
            .addEventListener(
                "click",
                () => renameSubject(subject)
            );


        row
            .querySelector(
                ".delete-button"
            )
            .addEventListener(
                "click",
                () => deleteSubject(subject)
            );


        list.appendChild(row);

    });

}


// ============================================================
// 科目追加
// ============================================================

async function addSubject() {

    const name =
        prompt(
            "科目名を入力してください。"
        );


    if (!name?.trim()) {

        return;

    }


    const { data: maxData } =
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
        maxData?.length
            ? maxData[0].sort_order + 1
            : 1;


    const { error } =
        await supabaseClient

            .from("subjects")

            .insert({

                name:
                    name.trim(),

                sort_order:
                    sortOrder

            });


    if (error) {

        alert(
            "追加できませんでした。"
        );

        console.error(error);

        return;

    }


    renderAdminSubjects();

}


// ============================================================
// 科目名前変更
// ============================================================

async function renameSubject(subject) {

    const name =
        prompt(
            "新しい科目名を入力してください。",
            subject.name
        );


    if (!name?.trim()) {

        return;

    }


    const { error } =
        await supabaseClient

            .from("subjects")

            .update({

                name:
                    name.trim()

            })

            .eq(
                "id",
                subject.id
            );


    if (error) {

        alert(
            "変更できませんでした。"
        );

        console.error(error);

        return;

    }


    renderAdminSubjects();

}


// ============================================================
// 科目削除
// ============================================================

async function deleteSubject(subject) {

    if (
        !confirm(
            `「${subject.name}」を削除しますか？\n関連する大問・小問も削除されます。`
        )
    ) {

        return;

    }


    const { error } =
        await supabaseClient

            .from("subjects")

            .delete()

            .eq(
                "id",
                subject.id
            );


    if (error) {

        alert(
            "削除できませんでした。"
        );

        console.error(error);

        return;

    }


    renderAdminSubjects();

}


// ============================================================
// 管理者：大問管理
// ============================================================

async function renderAdminProblems() {

    const content =
        document
            .getElementById(
                "admin-content"
            );


    const {
        data: subjects,
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

        content.innerHTML =
            "<p class='error'>科目を読み込めませんでした。</p>";

        return;

    }


    content.innerHTML = `

        <h2>大問管理</h2>

        <select
            id="admin-problem-subject-select">

            <option value="">
                科目を選択してください
            </option>

            ${subjects
                .map(subject => `
                    <option value="${subject.id}">
                        ${escapeHtml(subject.name)}
                    </option>
                `)
                .join("")}

        </select>

        <div id="admin-problem-area"></div>

    `;


    document
        .getElementById(
            "admin-problem-subject-select"
        )
        .addEventListener(
            "change",
            async event => {

                const subjectId =
                    Number(
                        event.target.value
                    );


                if (!subjectId) {

                    document
                        .getElementById(
                            "admin-problem-area"
                        )
                        .innerHTML = "";

                    return;

                }


                adminSubject =
                    subjects.find(
                        subject =>
                            subject.id === subjectId
                    );


                await loadAdminProblems(
                    subjectId
                );

            }
        );

}


// ============================================================
// 大問一覧
// ============================================================

async function loadAdminProblems(
    subjectId
) {

    const area =
        document
            .getElementById(
                "admin-problem-area"
            );


    area.innerHTML = `

        <div class="admin-toolbar">

            <button
                id="add-problem-button"
                class="primary-button">

                ＋ 大問を追加

            </button>

        </div>

        <div
            id="admin-problem-list"
            class="admin-list">

            読み込み中...

        </div>

    `;


    document
        .getElementById(
            "add-problem-button"
        )
        .addEventListener(
            "click",
            () => addProblem(subjectId)
        );


    const { data, error } =
        await supabaseClient

            .from("problems")

            .select("*")

            .eq(
                "subject_id",
                subjectId
            )

            .order(
                "sort_order",
                {
                    ascending: true
                }
            )

            .order(
                "id",
                {
                    ascending: true
                }
            );


    const list =
        document
            .getElementById(
                "admin-problem-list"
            );


    if (error) {

        list.innerHTML =
            "<p class='error'>読み込みに失敗しました。</p>";

        return;

    }


    list.innerHTML = "";


    data.forEach(problem => {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "admin-row";


        row.innerHTML = `

            <div class="admin-row-main">

                <strong>
                    ${escapeHtml(problem.name)}
                </strong>

                <div class="admin-row-actions">

                    <button
                        class="secondary-button rename-button">

                        名前変更

                    </button>

                    <button
                        class="danger-button delete-button">

                        削除

                    </button>

                </div>

            </div>

        `;


        row
            .querySelector(
                ".rename-button"
            )
            .addEventListener(
                "click",
                () =>
                    renameProblem(
                        problem,
                        subjectId
                    )
            );


        row
            .querySelector(
                ".delete-button"
            )
            .addEventListener(
                "click",
                () =>
                    deleteProblem(
                        problem,
                        subjectId
                    )
            );


        list.appendChild(row);

    });

}


// ============================================================
// 大問追加
// ============================================================

async function addProblem(
    subjectId
) {

    const name =
        prompt(
            "大問名を入力してください。"
        );


    if (!name?.trim()) {

        return;

    }


    const {
        data: maxData
    } =
        await supabaseClient

            .from("problems")

            .select("sort_order")

            .eq(
                "subject_id",
                subjectId
            )

            .order(
                "sort_order",
                {
                    ascending: false
                }
            )

            .limit(1);


    const sortOrder =
        maxData?.length
            ? maxData[0].sort_order + 1
            : 1;


    const { error } =
        await supabaseClient

            .from("problems")

            .insert({

                subject_id:
                    subjectId,

                name:
                    name.trim(),

                sort_order:
                    sortOrder

            });


    if (error) {

        alert(
            "追加できませんでした。"
        );

        console.error(error);

        return;

    }


    loadAdminProblems(
        subjectId
    );

}


// ============================================================
// 大問名前変更
// ============================================================

async function renameProblem(
    problem,
    subjectId
) {

    const name =
        prompt(
            "新しい大問名を入力してください。",
            problem.name
        );


    if (!name?.trim()) {

        return;

    }


    const { error } =
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
            "変更できませんでした。"
        );

        console.error(error);

        return;

    }


    loadAdminProblems(
        subjectId
    );

}


// ============================================================
// 大問削除
// ============================================================

async function deleteProblem(
    problem,
    subjectId
) {

    if (
        !confirm(
            `「${problem.name}」を削除しますか？\n関連する小問も削除されます。`
        )
    ) {

        return;

    }


    const { error } =
        await supabaseClient

            .from("problems")

            .delete()

            .eq(
                "id",
                problem.id
            );


    if (error) {

        alert(
            "削除できませんでした。"
        );

        console.error(error);

        return;

    }


    loadAdminProblems(
        subjectId
    );

}


// ============================================================
// 管理者：小問管理
// ============================================================

async function renderAdminQuestions() {

    const content =
        document
            .getElementById(
                "admin-content"
            );


    const {
        data: subjects,
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

        content.innerHTML =
            "<p class='error'>科目を読み込めませんでした。</p>";

        return;

    }


    content.innerHTML = `

        <h2>小問管理</h2>

        <select
            id="admin-question-subject-select">

            <option value="">
                科目を選択してください
            </option>

            ${subjects
                .map(subject => `
                    <option value="${subject.id}">
                        ${escapeHtml(subject.name)}
                    </option>
                `)
                .join("")}

        </select>


        <select
            id="admin-question-problem-select"
            disabled>

            <option value="">
                先に大問を選択してください
            </option>

        </select>


        <div
            id="admin-question-area">
        </div>

    `;


    document
        .getElementById(
            "admin-question-subject-select"
        )
        .addEventListener(
            "change",
            async event => {

                const subjectId =
                    Number(
                        event.target.value
                    );


                const problemSelect =
                    document
                        .getElementById(
                            "admin-question-problem-select"
                        );


                problemSelect.innerHTML = `

                    <option value="">
                        大問を選択してください
                    </option>

                `;


                problemSelect.disabled =
                    true;


                document
                    .getElementById(
                        "admin-question-area"
                    )
                    .innerHTML = "";


                if (!subjectId) {

                    return;

                }


                const {
                    data: problems
                } =
                    await supabaseClient

                        .from("problems")

                        .select("*")

                        .eq(
                            "subject_id",
                            subjectId
                        )

                        .order(
                            "sort_order",
                            {
                                ascending: true
                            }
                        );


                problems.forEach(
                    problem => {

                        const option =
                            document
                                .createElement(
                                    "option"
                                );


                        option.value =
                            problem.id;


                        option.textContent =
                            problem.name;


                        problemSelect
                            .appendChild(
                                option
                            );

                    }
                );


                problemSelect.disabled =
                    false;

            }
        );


    document
        .getElementById(
            "admin-question-problem-select"
        )
        .addEventListener(
            "change",
            async event => {

                const problemId =
                    Number(
                        event.target.value
                    );


                if (!problemId) {

                    document
                        .getElementById(
                            "admin-question-area"
                        )
                        .innerHTML = "";

                    return;

                }


                const {
                    data: problem
                } =
                    await supabaseClient

                        .from("problems")

                        .select("*")

                        .eq(
                            "id",
                            problemId
                        )

                        .single();


                adminProblem =
                    problem;


                await loadAdminQuestions(
                    problemId
                );

            }
        );

}


// ============================================================
// 小問一覧
// ============================================================

async function loadAdminQuestions(
    problemId
) {

    const area =
        document
            .getElementById(
                "admin-question-area"
            );


    area.innerHTML = `

        <div class="admin-toolbar">

            <button
                id="add-question-button"
                class="primary-button">

                ＋ 小問を追加

            </button>

        </div>


        <div
            id="admin-question-list"
            class="admin-list">

            読み込み中...

        </div>

    `;


    document
        .getElementById(
            "add-question-button"
        )
        .addEventListener(
            "click",
            () =>
                openQuestionEditor(
                    null,
                    problemId
                )
        );


    const { data, error } =
        await supabaseClient

            .from("questions")

            .select("*")

            .eq(
                "problem_id",
                problemId
            )

            .order(
                "sort_order",
                {
                    ascending: true
                }
            )

            .order(
                "id",
                {
                    ascending: true
                }
            );


    const list =
        document
            .getElementById(
                "admin-question-list"
            );


    if (error) {

        list.innerHTML =
            "<p class='error'>読み込みに失敗しました。</p>";

        return;

    }


    list.innerHTML = "";


    data.forEach(question => {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "admin-row";


        row.innerHTML = `

            <div class="admin-row-main">

                <div>

                    <strong>
                        ${escapeHtml(question.name)}
                    </strong>

                    <div class="muted">

                        ${
                            question.answer
                                ? "解答あり"
                                : "解答なし"
                        }

                    </div>

                </div>


                <div class="admin-row-actions">

                    <button
                        class="secondary-button edit-button">

                        編集

                    </button>


                    <button
                        class="danger-button delete-button">

                        削除

                    </button>

                </div>

            </div>

        `;


        row
            .querySelector(
                ".edit-button"
            )
            .addEventListener(
                "click",
                () =>
                    openQuestionEditor(
                        question,
                        problemId
                    )
            );


        row
            .querySelector(
                ".delete-button"
            )
            .addEventListener(
                "click",
                () =>
                    deleteQuestion(
                        question,
                        problemId
                    )
            );


        list.appendChild(row);

    });

}


// ============================================================
// 小問編集画面
// ============================================================

function openQuestionEditor(
    question,
    problemId
) {

    const area =
        document
            .getElementById(
                "admin-question-area"
            );


    editingQuestion =
        question;


    area.innerHTML = `

        <div
            class="card"
            style="margin-top:20px;">

            <h3>
                ${
                    question
                        ? "小問を編集"
                        : "小問を追加"
                }
            </h3>


            <label>
                小問名
            </label>


            <input
                id="edit-question-name"
                value="${
                    question
                        ? escapeAttribute(
                            question.name
                        )
                        : ""
                }"
                placeholder="例：(1)"
            >


            <label>
                問題文
            </label>


            <textarea
                id="edit-question-problem"
                rows="5"
                placeholder="問題文"
            >${
                question
                    ? escapeHtml(
                        question.problem || ""
                    )
                    : ""
            }</textarea>


            <label>
                解答
            </label>


            <textarea
                id="edit-question-answer"
                rows="5"
                placeholder="解答"
            >${
                question
                    ? escapeHtml(
                        question.answer || ""
                    )
                    : ""
            }</textarea>


            <label>
                解説
            </label>


            <textarea
                id="edit-question-explanation"
                rows="5"
                placeholder="解説"
            >${
                question
                    ? escapeHtml(
                        question.explanation || ""
                    )
                    : ""
            }</textarea>


            <label>
                問題画像
            </label>


            <input
                id="edit-question-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
            >


            ${
                question?.image_url
                    ? `

                        <p class="muted">
                            現在の画像：
                        </p>

                        <img
                            src="${escapeAttribute(
                                question.image_url
                            )}"
                            style="
                                max-width:300px;
                                max-height:200px;
                                border:1px solid #ddd;
                            "
                        >

                        <label
                            style="
                                display:block;
                                margin:10px 0;
                            "
                        >

                            <input
                                id="remove-question-image"
                                type="checkbox"
                                style="width:auto;"
                            >

                            現在の画像を削除する

                        </label>

                    `
                    : ""
            }


            <div
                class="form-actions">

                <button
                    id="cancel-question-edit"
                    class="secondary-button">

                    キャンセル

                </button>


                <button
                    id="save-question-button"
                    class="primary-button">

                    保存

                </button>

            </div>


            <p
                id="question-edit-result"
                class="result-message">
            </p>

        </div>

    `;


    document
        .getElementById(
            "cancel-question-edit"
        )
        .addEventListener(
            "click",
            () =>
                loadAdminQuestions(
                    problemId
                )
        );


    document
        .getElementById(
            "save-question-button"
        )
        .addEventListener(
            "click",
            () =>
                saveQuestion(
                    question,
                    problemId
                )
        );

}


// ============================================================
// 小問保存
// ============================================================

async function saveQuestion(
    question,
    problemId
) {

    const name =
        document
            .getElementById(
                "edit-question-name"
            )
            .value
            .trim();


    const problemText =
        document
            .getElementById(
                "edit-question-problem"
            )
            .value;


    const answer =
        document
            .getElementById(
                "edit-question-answer"
            )
            .value;


    const explanation =
        document
            .getElementById(
                "edit-question-explanation"
            )
            .value;


    const fileInput =
        document
            .getElementById(
                "edit-question-image"
            );


    const result =
        document
            .getElementById(
                "question-edit-result"
            );


    if (!name) {

        result.textContent =
            "小問名を入力してください。";

        result.style.color =
            "#b42318";

        return;

    }


    const saveButton =
        document
            .getElementById(
                "save-question-button"
            );


    saveButton.disabled =
        true;


    saveButton.textContent =
        "保存中...";


    let questionId =
        question?.id;


    let imageUrl =
        question?.image_url ||
        null;


    let imagePath =
        question?.image_path ||
        null;


    try {

        // ----------------------------------------------------
        // 新規小問
        // ----------------------------------------------------

        if (!question) {

            const {
                data: maxData
            } =
                await supabaseClient

                    .from("questions")

                    .select("sort_order")

                    .eq(
                        "problem_id",
                        problemId
                    )

                    .order(
                        "sort_order",
                        {
                            ascending: false
                        }
                    )

                    .limit(1);


            const sortOrder =
                maxData?.length
                    ? maxData[0].sort_order + 1
                    : 1;


            const {
                data,
                error
            } =
                await supabaseClient

                    .from("questions")

                    .insert({

                        problem_id:
                            problemId,

                        name:
                            name,

                        problem:
                            problemText,

                        answer:
                            answer,

                        explanation:
                            explanation,

                        sort_order:
                            sortOrder

                    })

                    .select()

                    .single();


            if (error) {

                throw error;

            }


            questionId =
                data.id;

        }

        // ----------------------------------------------------
        // 既存小問
        // ----------------------------------------------------

        else {

            const { error } =
                await supabaseClient

                    .from("questions")

                    .update({

                        name:
                            name,

                        problem:
                            problemText,

                        answer:
                            answer,

                        explanation:
                            explanation

                    })

                    .eq(
                        "id",
                        question.id
                    );


            if (error) {

                throw error;

            }

        }


        // ----------------------------------------------------
        // 画像削除
        // ----------------------------------------------------

        const removeCheckbox =
            document
                .getElementById(
                    "remove-question-image"
                );


        if (
            removeCheckbox?.checked &&
            imagePath
        ) {

            const {
                error: removeError
            } =
                await supabaseClient
                    .storage
                    .from("test-images")
                    .remove([
                        imagePath
                    ]);


            if (removeError) {

                console.warn(
                    "古い画像の削除に失敗:",
                    removeError
                );

            }


            imageUrl =
                null;


            imagePath =
                null;

        }


        // ----------------------------------------------------
        // 新しい画像
        // ----------------------------------------------------

        if (
            fileInput &&
            fileInput.files.length > 0
        ) {

            const file =
                fileInput.files[0];


            if (
                file.size >
                10 * 1024 * 1024
            ) {

                throw new Error(
                    "画像は10MB以下にしてください。"
                );

            }


            const allowedTypes = [

                "image/png",
                "image/jpeg",
                "image/webp"

            ];


            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                throw new Error(
                    "PNG、JPEG、WebPのみ使用できます。"
                );

            }


            // 古い画像を削除
            if (imagePath) {

                await supabaseClient
                    .storage
                    .from("test-images")
                    .remove([
                        imagePath
                    ]);

            }


            const extension =
                file.name
                    .split(".")
                    .pop()
                    .toLowerCase();


            const newPath =
                `questions/${questionId}-${Date.now()}.${extension}`;


            const {
                error: uploadError
            } =
                await supabaseClient
                    .storage
                    .from("test-images")
                    .upload(
                        newPath,
                        file,
                        {
                            upsert: false,
                            contentType:
                                file.type
                        }
                    );


            if (uploadError) {

                throw uploadError;

            }


            const {
                data: publicData
            } =
                supabaseClient
                    .storage
                    .from("test-images")
                    .getPublicUrl(
                        newPath
                    );


            imageUrl =
                publicData.publicUrl;


            imagePath =
                newPath;

        }


        // ----------------------------------------------------
        // 画像情報をDBへ
        // ----------------------------------------------------

        const {
            error: imageUpdateError
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
                    questionId
                );


        if (imageUpdateError) {

            throw imageUpdateError;

        }


        result.textContent =
            "保存しました。";


        result.style.color =
            "#277043";


        setTimeout(
            () => {

                loadAdminQuestions(
                    problemId
                );

            },
            600
        );

    }

    catch (error) {

        console.error(error);


        result.textContent =
            error.message ||
            "保存できませんでした。";


        result.style.color =
            "#b42318";


        saveButton.disabled =
            false;


        saveButton.textContent =
            "保存";

    }

}


// ============================================================
// 小問削除
// ============================================================

async function deleteQuestion(
    question,
    problemId
) {

    if (
        !confirm(
            `「${question.name}」を削除しますか？`
        )
    ) {

        return;

    }


    if (question.image_path) {

        await supabaseClient
            .storage
            .from("test-images")
            .remove([
                question.image_path
            ]);

    }


    const { error } =
        await supabaseClient

            .from("questions")

            .delete()

            .eq(
                "id",
                question.id
            );


    if (error) {

        alert(
            "削除できませんでした。"
        );

        console.error(error);

        return;

    }


    loadAdminQuestions(
        problemId
    );

}


// ============================================================
// 管理者：ご要望一覧
// ============================================================

async function renderAdminRequests() {

    const content =
        document
            .getElementById(
                "admin-content"
            );


    content.innerHTML = `

        <h2>
            ご要望・訂正報告
        </h2>

        <div
            id="admin-request-list"
            class="admin-list">

            読み込み中...

        </div>

    `;


    const list =
        document
            .getElementById(
                "admin-request-list"
            );


    const {
        data,
        error
    } =
        await supabaseClient

            .from("requests")

            .select(`

                id,
                message,
                status,
                created_at,

                subjects(name),

                problems(name),

                questions(name)

            `)

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        list.innerHTML =
            "<p class='error'>ご要望を読み込めませんでした。</p>";

        return;

    }


    list.innerHTML = "";


    if (
        !data ||
        data.length === 0
    ) {

        list.innerHTML =
            "<p>ご要望はありません。</p>";

        return;

    }


    data.forEach(request => {

        const subjectName =
            request.subjects?.name ||
            "不明";


        const problemName =
            request.problems?.name ||
            "不明";


        const questionName =
            request.questions?.name ||
            "指定なし";


        const date =
            new Date(
                request.created_at
            )
            .toLocaleString(
                "ja-JP"
            );


        const row =
            document.createElement(
                "div"
            );


        row.className =
            "admin-row request-row";


        row.innerHTML = `

            <div
                class="request-meta">

                ${escapeHtml(subjectName)}
                ＞
                ${escapeHtml(problemName)}
                ＞
                ${escapeHtml(questionName)}

                ／

                ${escapeHtml(date)}

            </div>


            <div
                class="${
                    request.status === "未確認"
                        ? "status-unread"
                        : "status-read"
                }">

                ${escapeHtml(
                    request.status
                )}

            </div>


            <div
                class="request-body">

                ${escapeHtml(
                    request.message
                )}

            </div>


            <div
                class="admin-row-actions">

                ${
                    request.status === "未確認"

                    ?

                    `
                        <button
                            class="secondary-button read-button">

                            確認済みにする

                        </button>
                    `

                    :

                    `
                        <button
                            class="secondary-button unread-button">

                            未確認に戻す

                        </button>
                    `
                }


                <button
                    class="danger-button delete-request-button">

                    削除

                </button>

            </div>

        `;


        if (
            request.status ===
            "未確認"
        ) {

            row
                .querySelector(
                    ".read-button"
                )
                .addEventListener(
                    "click",
                    () =>
                        updateRequestStatus(
                            request.id,
                            "確認済み"
                        )
                );

        }

        else {

            row
                .querySelector(
                    ".unread-button"
                )
                .addEventListener(
                    "click",
                    () =>
                        updateRequestStatus(
                            request.id,
                            "未確認"
                        )
                );

        }


        row
            .querySelector(
                ".delete-request-button"
            )
            .addEventListener(
                "click",
                () =>
                    deleteRequest(
                        request.id
                    )
            );


        list.appendChild(row);

    });

}


// ============================================================
// ご要望の状態変更
// ============================================================

async function updateRequestStatus(
    id,
    status
) {

    const { error } =
        await supabaseClient

            .from("requests")

            .update({

                status:
                    status

            })

            .eq(
                "id",
                id
            );


    if (error) {

        alert(
            "状態を変更できませんでした。"
        );

        console.error(error);

        return;

    }


    renderAdminRequests();

}


// ============================================================
// ご要望削除
// ============================================================

async function deleteRequest(
    id
) {

    if (
        !confirm(
            "このご要望を削除しますか？"
        )
    ) {

        return;

    }


    const { error } =
        await supabaseClient

            .from("requests")

            .delete()

            .eq(
                "id",
                id
            );


    if (error) {

        alert(
            "削除できませんでした。"
        );

        console.error(error);

        return;

    }


    renderAdminRequests();

}


// ============================================================
// HTMLエスケープ
// ============================================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(value) {

    return escapeHtml(value);

}