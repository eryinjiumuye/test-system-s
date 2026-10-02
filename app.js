const SUPABASE_URL = "https://yaxkvabopvindlbdzxpn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9TVmVas__w6DahDgshdEnw_hri2O_Ie";


const INVITE_CODE = "1234";
const BUCKET_NAME = "test-images";

let supabaseClient = null;
let currentSubject = null;
let currentProblem = null;
let currentQuestion = null;
let adminSubject = null;
let adminProblem = null;

document.addEventListener("DOMContentLoaded", () => {
    setupEvents();

    if (
        !window.supabase ||
        !window.supabase.createClient ||
        SUPABASE_ANON_KEY.includes("ここに")
    ) {
        console.error("SupabaseのURL・キーまたはライブラリを確認してください。");
        return;
    }

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

    console.log("Supabase初期化成功");
});

function $(id) {
    return document.getElementById(id);
}

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });
    $(id)?.classList.add("active");
}

function setupEvents() {
    $("home-button").addEventListener("click", event => {
        event.preventDefault();
        showScreen("entry-screen");
    });

    $("enter-button").addEventListener("click", enterSystem);
    $("invite-code").addEventListener("keydown", event => {
        if (event.key === "Enter") enterSystem();
    });

    $("admin-button").addEventListener("click", () => {
        $("admin-login-error").textContent = "";
        showScreen("admin-login-screen");
    });

    $("admin-login-button").addEventListener("click", adminLogin);
    $("admin-password").addEventListener("keydown", event => {
        if (event.key === "Enter") adminLogin();
    });

    $("admin-login-back").addEventListener("click", () => {
        showScreen("entry-screen");
    });

    $("admin-logout-button").addEventListener("click", adminLogout);

    $("problem-back").addEventListener("click", showSubjects);
    $("question-back").addEventListener("click", () => showProblems(currentSubject));
    $("answer-back").addEventListener("click", () => showQuestions(currentProblem));

    $("request-button").addEventListener("click", openRequestScreen);
    $("request-cancel").addEventListener("click", () => {
        if (currentQuestion) showAnswer(currentQuestion.id);
        else showQuestions(currentProblem);
    });
    $("request-submit").addEventListener("click", submitRequest);

    $("admin-subject-menu").addEventListener("click", () => {
        adminSubject = null;
        adminProblem = null;
        renderAdminSubjects();
    });
    $("admin-problem-menu").addEventListener("click", renderAdminProblems);
    $("admin-question-menu").addEventListener("click", renderAdminQuestions);
    $("admin-request-menu").addEventListener("click", renderAdminRequests);
}

function ensureDatabase() {
    if (!supabaseClient) {
        alert("Supabaseに接続できません。URLとキーを確認してください。");
        return false;
    }
    return true;
}

async function enterSystem() {
    $("entry-error").textContent = "";

    if ($("invite-code").value.trim() !== INVITE_CODE) {
        $("entry-error").textContent = "招待コードが正しくありません。";
        return;
    }

    if (!ensureDatabase()) return;
    await showSubjects();
}

async function showSubjects() {
    if (!ensureDatabase()) return;
    showScreen("subject-screen");
    $("subject-list").textContent = "読み込み中...";

    const { data, error } = await supabaseClient
        .from("subjects")
        .select("*")
        .order("sort_order")
        .order("id");

    if (error) {
        console.error(error);
        $("subject-list").textContent = "科目を読み込めませんでした。";
        return;
    }

    $("subject-list").replaceChildren();

    if (!data.length) {
        $("subject-list").textContent = "科目がありません。";
        return;
    }

    data.forEach(subject => {
        const button = document.createElement("button");
        button.textContent = subject.name;
        button.addEventListener("click", () => {
            currentSubject = subject;
            currentProblem = null;
            currentQuestion = null;
            showProblems(subject);
        });
        $("subject-list").append(button);
    });
}

async function showProblems(subject) {
    if (!subject || !ensureDatabase()) return;
    currentSubject = subject;
    showScreen("problem-screen");
    $("problem-title").textContent = `${subject.name}：大問を選択`;
    $("problem-list").textContent = "読み込み中...";

    const { data, error } = await supabaseClient
        .from("problems")
        .select("*")
        .eq("subject_id", subject.id)
        .order("sort_order")
        .order("id");

    if (error) {
        console.error(error);
        $("problem-list").textContent = "大問を読み込めませんでした。";
        return;
    }

    $("problem-list").replaceChildren();

    if (!data.length) {
        $("problem-list").textContent = "大問がありません。";
        return;
    }

    data.forEach(problem => {
        const button = document.createElement("button");
        button.textContent = problem.name;
        button.addEventListener("click", () => {
            currentProblem = problem;
            currentQuestion = null;
            showQuestions(problem);
        });
        $("problem-list").append(button);
    });
}

async function showQuestions(problem) {
    if (!problem || !ensureDatabase()) return;
    currentProblem = problem;
    showScreen("question-screen");
    $("question-title").textContent = `${currentSubject.name} ＞ ${problem.name}`;
    $("question-list").textContent = "読み込み中...";

    const { data, error } = await supabaseClient
        .from("questions")
        .select("id, name, problem_id, sort_order")
        .eq("problem_id", problem.id)
        .order("sort_order")
        .order("id");

    if (error) {
        console.error(error);
        $("question-list").textContent = "小問を読み込めませんでした。";
        return;
    }

    $("question-list").replaceChildren();

    if (!data.length) {
        $("question-list").textContent = "小問がありません。";
        return;
    }

    data.forEach(question => {
        const button = document.createElement("button");
        button.textContent = question.name;
        button.addEventListener("click", () => showAnswer(question.id));
        $("question-list").append(button);
    });
}

async function showAnswer(questionId) {
    if (!ensureDatabase()) return;

    const { data, error } = await supabaseClient
        .from("questions")
        .select("*")
        .eq("id", questionId)
        .single();

    if (error) {
        console.error(error);
        alert("解答を読み込めませんでした。");
        return;
    }

    currentQuestion = data;
    showScreen("answer-screen");

    $("answer-breadcrumb").textContent =
        `${currentSubject.name} ＞ ${currentProblem.name} ＞ ${data.name}`;

    $("answer-question-name").textContent = data.name;
    $("answer-text").textContent = data.answer || "解答が登録されていません。";
}

function openRequestScreen() {
    if (!currentSubject || !currentProblem || !currentQuestion) {
        alert("先に小問の解答を開いてください。");
        return;
    }

    $("request-breadcrumb").textContent =
        `${currentSubject.name} ＞ ${currentProblem.name} ＞ ${currentQuestion.name}`;

    $("request-message").value = "";
    $("request-result").textContent = "";
    showScreen("request-screen");
}

async function submitRequest() {
    if (!ensureDatabase()) return;

    const message = $("request-message").value.trim();
    const result = $("request-result");
    const button = $("request-submit");

    if (!message) {
        result.style.color = "#b42318";
        result.textContent = "内容を入力してください。";
        return;
    }

    if (message.length > 1000) {
        result.style.color = "#b42318";
        result.textContent = "1000文字以内で入力してください。";
        return;
    }

    button.disabled = true;
    button.textContent = "送信中...";

    try {
        const { error } = await supabaseClient.from("requests").insert({
            subject_id: currentSubject.id,
            problem_id: currentProblem.id,
            question_id: currentQuestion.id,
            message,
            status: "未確認"
        });

        if (error) throw error;

        result.style.color = "#277043";
        result.textContent = "送信しました。ありがとうございます。";

        setTimeout(() => {
            showAnswer(currentQuestion.id);
        }, 900);
    } catch (error) {
        console.error(error);
        result.style.color = "#b42318";
        result.textContent = "送信できませんでした。requestsテーブルと権限を確認してください。";
    } finally {
        button.disabled = false;
        button.textContent = "送信する";
    }
}

async function checkAdmin() {
    const { data: { user }, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !user) return false;

    const { data, error } = await supabaseClient
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error(error);
        return false;
    }

    return !!data;
}

async function adminLogin() {
    if (!ensureDatabase()) return;

    const email = $("admin-email").value.trim();
    const password = $("admin-password").value;
    const errorBox = $("admin-login-error");

    errorBox.textContent = "";

    if (!email || !password) {
        errorBox.textContent = "メールアドレスとパスワードを入力してください。";
        return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        console.error(error);
        errorBox.textContent = "ログインできませんでした。";
        return;
    }

    if (!(await checkAdmin())) {
        await supabaseClient.auth.signOut();
        errorBox.textContent = "このアカウントには管理者権限がありません。";
        return;
    }

    $("admin-email").value = "";
    $("admin-password").value = "";
    adminSubject = null;
    adminProblem = null;
    showScreen("admin-screen");
    await renderAdminSubjects();
}

async function adminLogout() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    adminSubject = null;
    adminProblem = null;
    showScreen("entry-screen");
}

// 管理者操作前にも、認証中の管理者であることを確認する
async function requireAdmin() {
    if (!ensureDatabase()) return false;

    if (await checkAdmin()) return true;

    alert("管理者としてログインしてください。");
    showScreen("admin-login-screen");
    return false;
}

function makeButton(text, className, callback) {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = className;
    button.addEventListener("click", callback);
    return button;
}

async function renderAdminSubjects() {
    if (!(await requireAdmin())) return;

    const content = $("admin-content");
    content.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = "科目管理";
    content.append(title);

    content.append(makeButton("＋ 科目を追加", "primary-button", addSubject));

    const list = document.createElement("div");
    list.className = "admin-list";
    list.textContent = "読み込み中...";
    content.append(list);

    const { data, error } = await supabaseClient
        .from("subjects")
        .select("*")
        .order("sort_order")
        .order("id");

    if (error) {
        console.error(error);
        list.textContent = "科目を読み込めませんでした。";
        return;
    }

    list.replaceChildren();

    if (!data.length) {
        list.textContent = "科目がありません。追加してください。";
        return;
    }

    data.forEach(subject => {
        const row = document.createElement("div");
        row.className = "admin-row";

        const name = document.createElement("strong");
        name.textContent = subject.name;
        row.append(name);

        const actions = document.createElement("div");
        actions.className = "admin-row-actions";

        actions.append(
            makeButton("この科目を選択 → 大問管理", "primary-button", async () => {
                adminSubject = subject;
                adminProblem = null;
                await renderAdminProblems();
            }),
            makeButton("名前変更", "secondary-button", () => renameSubject(subject)),
            makeButton("削除", "danger-button", () => deleteSubject(subject))
        );

        row.append(actions);
        list.append(row);
    });
}

async function addSubject() {
    if (!(await requireAdmin())) return;

    const name = prompt("科目名を入力してください。");
    if (!name?.trim()) return;

    const { data: last } = await supabaseClient
        .from("subjects").select("sort_order")
        .order("sort_order", { ascending: false }).limit(1);

    const { error } = await supabaseClient.from("subjects").insert({
        name: name.trim(),
        sort_order: last?.length ? last[0].sort_order + 1 : 1
    });

    if (error) {
        console.error(error);
        alert("科目を追加できませんでした。");
        return;
    }
    await renderAdminSubjects();
}

async function renameSubject(subject) {
    if (!(await requireAdmin())) return;

    const name = prompt("新しい科目名", subject.name);
    if (!name?.trim()) return;

    const { error } = await supabaseClient
        .from("subjects").update({ name: name.trim() }).eq("id", subject.id);

    if (error) {
        console.error(error);
        alert("名前を変更できませんでした。");
        return;
    }
    await renderAdminSubjects();
}

async function deleteSubject(subject) {
    if (!(await requireAdmin())) return;
    if (!confirm(`「${subject.name}」を削除しますか？関連する大問・小問も削除されます。`)) return;

    const { error } = await supabaseClient.from("subjects").delete().eq("id", subject.id);

    if (error) {
        console.error(error);
        alert("削除できませんでした。");
        return;
    }

    adminSubject = null;
    await renderAdminSubjects();
}

async function renderAdminProblems() {
    if (!(await requireAdmin())) return;

    if (!adminSubject) {
        await renderAdminSubjects();
        return;
    }

    const content = $("admin-content");
    content.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = `${adminSubject.name}：大問管理`;
    content.append(title);

    content.append(
        makeButton("← 科目選択に戻る", "back-button", () => {
            adminSubject = null;
            renderAdminSubjects();
        }),
        makeButton("＋ 大問を追加", "primary-button", () => addProblem(adminSubject.id))
    );

    const list = document.createElement("div");
    list.className = "admin-list";
    list.textContent = "読み込み中...";
    content.append(list);

    const { data, error } = await supabaseClient
        .from("problems")
        .select("*")
        .eq("subject_id", adminSubject.id)
        .order("sort_order")
        .order("id");

    if (error) {
        console.error(error);
        list.textContent = "大問を読み込めませんでした。";
        return;
    }

    list.replaceChildren();

    if (!data.length) {
        list.textContent = "大問がありません。追加してください。";
        return;
    }

    data.forEach(problem => {
        const row = document.createElement("div");
        row.className = "admin-row";

        const name = document.createElement("strong");
        name.textContent = problem.name;
        row.append(name);

        const actions = document.createElement("div");
        actions.className = "admin-row-actions";

        actions.append(
            makeButton("この大問を選択 → 小問管理", "primary-button", async () => {
                adminProblem = problem;
                await renderAdminQuestions();
            }),
            makeButton("名前変更", "secondary-button", () => renameProblem(problem)),
            makeButton("削除", "danger-button", () => deleteProblem(problem))
        );

        row.append(actions);
        list.append(row);
    });
}

async function addProblem(subjectId) {
    if (!(await requireAdmin())) return;

    const name = prompt("大問名を入力してください。");
    if (!name?.trim()) return;

    const { data: last } = await supabaseClient
        .from("problems").select("sort_order").eq("subject_id", subjectId)
        .order("sort_order", { ascending: false }).limit(1);

    const { error } = await supabaseClient.from("problems").insert({
        subject_id: subjectId,
        name: name.trim(),
        sort_order: last?.length ? last[0].sort_order + 1 : 1
    });

    if (error) {
        console.error(error);
        alert("大問を追加できませんでした。");
        return;
    }
    await renderAdminProblems();
}

async function renameProblem(problem) {
    if (!(await requireAdmin())) return;

    const name = prompt("新しい大問名", problem.name);
    if (!name?.trim()) return;

    const { error } = await supabaseClient
        .from("problems").update({ name: name.trim() }).eq("id", problem.id);

    if (error) {
        console.error(error);
        alert("名前を変更できませんでした。");
        return;
    }
    await renderAdminProblems();
}

async function deleteProblem(problem) {
    if (!(await requireAdmin())) return;

    if (!confirm(`「${problem.name}」を削除しますか？関連する小問も削除されます。`)) return;

    const { error } = await supabaseClient.from("problems").delete().eq("id", problem.id);

    if (error) {
        console.error(error);
        alert("削除できませんでした。");
        return;
    }

    adminProblem = null;
    await renderAdminProblems();
}

async function renderAdminQuestions() {
    if (!(await requireAdmin())) return;

    if (!adminSubject) {
        await renderAdminSubjects();
        return;
    }

    if (!adminProblem) {
        await renderAdminProblems();
        return;
    }

    await loadAdminQuestions(adminProblem.id);
}

async function loadAdminQuestions(problemId) {
    if (!(await requireAdmin())) return;

    const content = $("admin-content");
    content.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = `${adminSubject.name} ＞ ${adminProblem.name}：小問管理`;
    content.append(title);

    content.append(
        makeButton("← 大問選択に戻る", "back-button", () => {
            adminProblem = null;
            renderAdminProblems();
        }),
        makeButton("＋ 小問を追加", "primary-button", () => openQuestionEditor(null, problemId))
    );

    const list = document.createElement("div");
    list.className = "admin-list";
    list.textContent = "読み込み中...";
    content.append(list);

    const { data, error } = await supabaseClient
        .from("questions").select("*").eq("problem_id", problemId)
        .order("sort_order").order("id");

    if (error) {
        console.error(error);
        list.textContent = "小問を読み込めませんでした。";
        return;
    }

    list.replaceChildren();

    if (!data.length) {
        list.textContent = "小問がありません。追加してください。";
        return;
    }

    data.forEach(question => {
        const row = document.createElement("div");
        row.className = "admin-row";

        const name = document.createElement("strong");
        name.textContent = `${question.name} — ${question.answer ? "解答あり" : "解答なし"}`;
        row.append(name);

        const actions = document.createElement("div");
        actions.className = "admin-row-actions";

        actions.append(
            makeButton("この小問を選択 → 解答編集", "primary-button", () => {
                openQuestionEditor(question, problemId);
            }),
            makeButton("名前変更", "secondary-button", () => renameQuestion(question, problemId)),
            makeButton("削除", "danger-button", () => deleteQuestion(question, problemId))
        );

        row.append(actions);
        list.append(row);
    });
}

async function addQuestion(problemId) {
    await openQuestionEditor(null, problemId);
}

async function renameQuestion(question, problemId) {
    if (!(await requireAdmin())) return;

    const name = prompt("新しい小問名", question.name);
    if (!name?.trim()) return;

    const { error } = await supabaseClient
        .from("questions").update({ name: name.trim() }).eq("id", question.id);

    if (error) {
        console.error(error);
        alert("名前を変更できませんでした。");
        return;
    }
    await loadAdminQuestions(problemId);
}

async function openQuestionEditor(question, problemId) {
    if (!(await requireAdmin())) return;

    const content = $("admin-content");
    content.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = `${adminSubject.name} ＞ ${adminProblem.name} ＞ ${question ? question.name : "新しい小問"}`;
    content.append(title);

    content.append(makeButton("← 小問一覧に戻る", "back-button", () => loadAdminQuestions(problemId)));

    const form = document.createElement("div");
    form.className = "editor-card";
    form.innerHTML = `
        <label for="edit-question-name">小問名</label>
        <input id="edit-question-name" placeholder="例：(1)">
        <label for="edit-question-answer">解答（一般ユーザーに表示）</label>
        <textarea id="edit-question-answer" rows="5"></textarea>
        <details>
            <summary>任意：問題文・解説・画像</summary>
            <label for="edit-question-problem">問題文</label>
            <textarea id="edit-question-problem" rows="4"></textarea>
            <label for="edit-question-explanation">解説</label>
            <textarea id="edit-question-explanation" rows="4"></textarea>
            <label for="edit-question-image">画像（PNG / JPEG / WebP、最大10MB）</label>
            <input id="edit-question-image" type="file" accept="image/png,image/jpeg,image/webp">
            <div id="current-image-area"></div>
            <label><input id="remove-question-image" type="checkbox" style="display:inline;width:auto"> 現在の画像を削除する</label>
        </details>
        <div class="form-actions">
            <button id="save-question-button" class="primary-button">保存</button>
            <button id="cancel-question-edit" class="secondary-button">キャンセル</button>
        </div>
        <p id="question-edit-result" class="result-message"></p>
    `;
    content.append(form);

    $("edit-question-name").value = question?.name || "";
    $("edit-question-answer").value = question?.answer || "";
    $("edit-question-problem").value = question?.problem || "";
    $("edit-question-explanation").value = question?.explanation || "";

    if (question?.image_url) {
        const image = document.createElement("img");
        image.src = question.image_url;
        image.alt = "登録済み画像";
        image.style.maxWidth = "100%";
        image.style.maxHeight = "260px";
        $("current-image-area").append(image);
    }

    $("save-question-button").addEventListener("click", () => saveQuestion(question, problemId));
    $("cancel-question-edit").addEventListener("click", () => loadAdminQuestions(problemId));
}

async function saveQuestion(question, problemId) {
    if (!(await requireAdmin())) return;

    const name = $("edit-question-name").value.trim();
    const answer = $("edit-question-answer").value;
    const problem = $("edit-question-problem").value;
    const explanation = $("edit-question-explanation").value;
    const file = $("edit-question-image").files[0];
    const removeImage = $("remove-question-image").checked;
    const result = $("question-edit-result");
    const saveButton = $("save-question-button");

    if (!name) {
        result.style.color = "#b42318";
        result.textContent = "小問名を入力してください。";
        return;
    }

    if (file && file.size > 10 * 1024 * 1024) {
        result.style.color = "#b42318";
        result.textContent = "画像は10MB以下にしてください。";
        return;
    }

    if (file && !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        result.style.color = "#b42318";
        result.textContent = "PNG、JPEG、WebP画像を選んでください。";
        return;
    }

    saveButton.disabled = true;
    result.textContent = "保存中...";

    try {
        let questionId = question?.id;
        let imageUrl = question?.image_url || null;
        let imagePath = question?.image_path || null;

        if (!question) {
            const { data: last } = await supabaseClient
                .from("questions").select("sort_order").eq("problem_id", problemId)
                .order("sort_order", { ascending: false }).limit(1);

            const { data, error } = await supabaseClient
                .from("questions")
                .insert({
                    problem_id: problemId,
                    name,
                    answer,
                    problem,
                    explanation,
                    sort_order: last?.length ? last[0].sort_order + 1 : 1
                })
                .select("*").single();

            if (error) throw error;
            questionId = data.id;
        } else {
            const { error } = await supabaseClient
                .from("questions")
                .update({ name, answer, problem, explanation })
                .eq("id", question.id);

            if (error) throw error;
        }

        if (removeImage && imagePath) {
            const { error } = await supabaseClient.storage.from(BUCKET_NAME).remove([imagePath]);
            if (error) console.warn("古い画像の削除に失敗:", error);
            imageUrl = null;
            imagePath = null;
        } else if (removeImage) {
            imageUrl = null;
            imagePath = null;
        }

        if (file) {
            if (imagePath) {
                const { error } = await supabaseClient.storage.from(BUCKET_NAME).remove([imagePath]);
                if (error) console.warn("以前の画像を削除できませんでした:", error);
            }

            const extension = file.name.split(".").pop().toLowerCase();
            const path = `questions/${questionId}-${Date.now()}.${extension}`;

            const { error: uploadError } = await supabaseClient.storage
                .from(BUCKET_NAME)
                .upload(path, file, { contentType: file.type, upsert: false });

            if (uploadError) throw uploadError;

            const { data: publicData } = supabaseClient.storage
                .from(BUCKET_NAME).getPublicUrl(path);

            imageUrl = publicData.publicUrl;
            imagePath = path;
        }

        const { error: imageError } = await supabaseClient
            .from("questions")
            .update({ image_url: imageUrl, image_path: imagePath })
            .eq("id", questionId);

        if (imageError) throw imageError;

        result.style.color = "#277043";
        result.textContent = "保存しました。";

        setTimeout(() => loadAdminQuestions(problemId), 700);
    } catch (error) {
        console.error(error);
        result.style.color = "#b42318";
        result.textContent = error.message || "保存に失敗しました。";
        saveButton.disabled = false;
    }
}

async function deleteQuestion(question, problemId) {
    if (!(await requireAdmin())) return;
    if (!confirm(`「${question.name}」を削除しますか？`)) return;

    if (question.image_path) {
        const { error: storageError } = await supabaseClient.storage
            .from(BUCKET_NAME).remove([question.image_path]);
        if (storageError) console.warn(storageError);
    }

    const { error } = await supabaseClient
        .from("questions").delete().eq("id", question.id);

    if (error) {
        console.error(error);
        alert("削除できませんでした。");
        return;
    }

    await loadAdminQuestions(problemId);
}

async function renderAdminRequests() {
    if (!(await requireAdmin())) return;

    const content = $("admin-content");
    content.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = "訂正・要望";
    content.append(title);

    const list = document.createElement("div");
    list.className = "admin-list";
    list.textContent = "読み込み中...";
    content.append(list);

    const { data, error } = await supabaseClient
        .from("requests")
        .select("id,message,status,created_at,subjects(name),problems(name),questions(name)")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        list.textContent = "ご要望を読み込めませんでした。requestsテーブルの設定を確認してください。";
        return;
    }

    list.replaceChildren();

    if (!data.length) {
        list.textContent = "ご要望はありません。";
        return;
    }

    data.forEach(request => {
        const row = document.createElement("div");
        row.className = "admin-row";

        const meta = document.createElement("div");
        meta.className = "request-meta";
        meta.textContent =
            `${request.subjects?.name || "不明"} ＞ ${request.problems?.name || "不明"} ＞ ${request.questions?.name || "不明"} / ${new Date(request.created_at).toLocaleString("ja-JP")}`;

        const status = document.createElement("span");
        status.className = request.status === "未確認" ? "status-unread" : "status-read";
        status.textContent = request.status;

        const body = document.createElement("div");
        body.className = "request-body";
        body.textContent = request.message;

        const actions = document.createElement("div");
        actions.className = "admin-row-actions";

        const nextStatus = request.status === "未確認" ? "確認済み" : "未確認";
        actions.append(
            makeButton(
                request.status === "未確認" ? "確認済みにする" : "未確認に戻す",
                "secondary-button",
                () => updateRequestStatus(request.id, nextStatus)
            ),
            makeButton("削除", "danger-button", () => deleteRequest(request.id))
        );

        row.append(meta, status, body, actions);
        list.append(row);
    });
}

async function updateRequestStatus(id, status) {
    if (!(await requireAdmin())) return;

    const { error } = await supabaseClient
        .from("requests").update({ status }).eq("id", id);

    if (error) {
        console.error(error);
        alert("状態を変更できませんでした。");
        return;
    }
    await renderAdminRequests();
}

async function deleteRequest(id) {
    if (!(await requireAdmin())) return;
    if (!confirm("このご要望を削除しますか？")) return;

    const { error } = await supabaseClient.from("requests").delete().eq("id", id);

    if (error) {
        console.error(error);
        alert("削除できませんでした。");
        return;
    }
    await renderAdminRequests();
}
