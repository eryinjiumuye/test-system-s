
"use strict";

// ========================================
// 1. 設定
// ========================================

const SUPABASE_URL = "https://yaxkvabopvindlbdzxpn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9TVmVas__w6DahDgshdEnw_hri2O_Ie";


const INVITE_CODE = "1234";
const BUCKET_NAME = "test-images";

let db = null;
let currentSubject = null;
let currentProblem = null;
let currentQuestion = null;
let returnScreenAfterRequest = "answer-screen";

let adminUser = null;
let adminSubject = null;
let adminProblem = null;

// ========================================
// 2. 共通処理
// ========================================

const $ = (id) => document.getElementById(id);

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.hidden = screen.id !== id;
  });

  $("admin-error").textContent = "";
}

function showError(id, message) {
  $(id).textContent = message;
}

function errorMessage(error) {
  return error?.message || String(error || "不明なエラーです。");
}

function makeButton(label, onClick, className = "secondary") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function makeItemButton(label, onClick) {
  const button = makeButton(label, onClick, "item-button");
  return button;
}

function makeAdminRow(title) {
  const row = document.createElement("div");
  row.className = "admin-row";

  const heading = document.createElement("div");
  heading.className = "admin-row-title";
  heading.textContent = title;

  row.appendChild(heading);
  return row;
}

function addField(parent, labelText, value = "", multiline = false) {
  const label = document.createElement("label");
  label.textContent = labelText;

  const input = document.createElement(multiline ? "textarea" : "input");

  if (!multiline) {
    input.type = "text";
  } else {
    input.rows = 5;
  }

  input.value = value ?? "";
  label.appendChild(input);
  parent.appendChild(label);

  return input;
}

function addFileField(parent, labelText) {
  const label = document.createElement("label");
  label.textContent = labelText;

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  label.appendChild(input);
  parent.appendChild(label);

  return input;
}

function addAdminMessage(message) {
  $("admin-content").appendChild(document.createTextNode(message));
}

function requireDb() {
  if (!db) {
    throw new Error(
      "Supabaseに接続できていません。URLと公開用キーを確認してください。"
    );
  }
}

async function checkAdmin() {
  requireDb();

  const { data: authData, error: authError } =
    await db.auth.getUser();

  if (authError || !authData.user) {
    adminUser = null;
    return false;
  }

  const { data, error } = await db
    .from("admin_users")
    .select("user_id")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    adminUser = null;
    return false;
  }

  adminUser = authData.user;
  return true;
}

async function requireAdmin() {
  const allowed = await checkAdmin();

  if (!allowed) {
    throw new Error("管理者権限がありません。ログインし直してください。");
  }
}

// ========================================
// 3. 入室
// ========================================

async function enterSystem() {
  showError("entry-error", "");

  if ($("invite-code").value !== INVITE_CODE) {
    showError("entry-error", "招待コードが正しくありません。");
    return;
  }

  if (!db) {
    showError(
      "entry-error",
      "データベースに接続できません。公開用キーと通信状態を確認してください。"
    );
    return;
  }

  const button = $("entry-form").querySelector("button");
  button.disabled = true;

  try {
    await loadSubjects();
    showScreen("subject-screen");
  } catch (error) {
    console.error("入室エラー:", error);
    showError(
      "entry-error",
      "科目一覧を読み込めませんでした。\n" + errorMessage(error)
    );
  } finally {
    button.disabled = false;
  }
}

async function loadSubjects() {
  requireDb();

  const { data, error } = await db
    .from("subjects")
    .select("id, name, sort_order")
    .order("sort_order")
    .order("id");

  if (error) throw error;

  const list = $("subject-list");
  list.replaceChildren();

  if (!data.length) {
    list.textContent = "科目がまだ登録されていません。";
    return;
  }

  data.forEach((subject) => {
    list.appendChild(
      makeItemButton(subject.name, () => showProblems(subject))
    );
  });
}

async function showProblems(subject) {
  currentSubject = subject;
  currentProblem = null;
  currentQuestion = null;

  $("problem-title").textContent = subject.name + "：大問一覧";
  $("problem-list").replaceChildren();
  showScreen("problem-screen");

  try {
    const { data, error } = await db
      .from("problems")
      .select("id, subject_id, name, sort_order")
      .eq("subject_id", subject.id)
      .order("sort_order")
      .order("id");

    if (error) throw error;

    if (!data.length) {
      $("problem-list").textContent = "大問がありません。";
      return;
    }

    data.forEach((problem) => {
      $("problem-list").appendChild(
        makeItemButton(problem.name, () => showQuestions(problem))
      );
    });
  } catch (error) {
    $("problem-list").textContent =
      "大問一覧を読み込めませんでした：" + errorMessage(error);
  }
}

async function showQuestions(problem) {
  currentProblem = problem;
  currentQuestion = null;

  $("question-title").textContent = problem.name + "：小問一覧";
  $("question-list").replaceChildren();
  showScreen("question-screen");

  try {
    const { data, error } = await db
      .from("questions")
      .select("id, problem_id, name, sort_order")
      .eq("problem_id", problem.id)
      .order("sort_order")
      .order("id");

    if (error) throw error;

    if (!data.length) {
      $("question-list").textContent = "小問がありません。";
      return;
    }

    data.forEach((question) => {
      $("question-list").appendChild(
        makeItemButton(question.name, () => showAnswer(question.id))
      );
    });
  } catch (error) {
    $("question-list").textContent =
      "小問一覧を読み込めませんでした：" + errorMessage(error);
  }
}

async function showAnswer(questionId) {
  try {
    const { data, error } = await db
      .from("questions")
      .select("id, name, answer")
      .eq("id", questionId)
      .single();

    if (error) throw error;

    currentQuestion = data;
    $("answer-breadcrumb").textContent =
      `${currentSubject?.name || ""} / ` +
      `${currentProblem?.name || ""} / ${data.name}`;

    $("answer-question-name").textContent = data.name;
    $("answer-text").textContent =
      data.answer?.trim() || "まだ解答が登録されていません。";

    showScreen("answer-screen");
  } catch (error) {
    alert("解答を読み込めませんでした。\n" + errorMessage(error));
  }
}

// ========================================
// 4. 訂正報告
// ========================================

function openRequestScreen() {
  if (!currentQuestion) {
    alert("先に小問を選択してください。");
    return;
  }

  $("request-breadcrumb").textContent =
    `${currentSubject?.name || ""} / ` +
    `${currentProblem?.name || ""} / ${currentQuestion.name}`;

  $("request-message").value = "";
  $("request-result").textContent = "";
  returnScreenAfterRequest = "answer-screen";
  showScreen("request-screen");
}

async function submitRequest() {
  const message = $("request-message").value.trim();

  if (!message) {
    $("request-result").textContent = "報告内容を入力してください。";
    return;
  }

  if (message.length > 1000) {
    $("request-result").textContent = "1000文字以内で入力してください。";
    return;
  }

  if (!currentQuestion) {
    $("request-result").textContent = "対象の小問が見つかりません。";
    return;
  }

  const button = $("request-submit");
  button.disabled = true;

  try {
    const { error } = await db.from("requests").insert({
      subject_id: currentSubject?.id ?? null,
      problem_id: currentProblem?.id ?? null,
      question_id: currentQuestion.id,
      message,
      status: "未確認"
    });

    if (error) throw error;

    $("request-result").textContent = "報告を送信しました。ありがとうございます。";
    $("request-message").value = "";
  } catch (error) {
    console.error("報告送信エラー:", error);
    $("request-result").textContent =
      "送信できませんでした。\n" + errorMessage(error);
  } finally {
    button.disabled = false;
  }
}

// ========================================
// 5. 管理者ログイン
// ========================================

async function openAdmin() {
  showError("admin-login-error", "");

  if (!db) {
    showScreen("admin-login-screen");
    showError(
      "admin-login-error",
      "Supabaseが初期化されていません。app.jsの設定を確認してください。"
    );
    return;
  }

  try {
    if (await checkAdmin()) {
      $("admin-email-display").textContent = adminUser.email || "";
      showScreen("admin-screen");
      await renderAdminSubjects();
    } else {
      showScreen("admin-login-screen");
    }
  } catch (error) {
    console.error("管理者確認エラー:", error);
    showScreen("admin-login-screen");
    showError("admin-login-error", errorMessage(error));
  }
}

async function adminLogin(event) {
  event.preventDefault();
  showError("admin-login-error", "");

  if (!db) {
    showError("admin-login-error", "Supabaseに接続できていません。");
    return;
  }

  const email = $("admin-email").value.trim();
  const password = $("admin-password").value;
  const button = $("admin-login-form").querySelector("button");

  button.disabled = true;

  try {
    const { error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    if (!(await checkAdmin())) {
      await db.auth.signOut();
      throw new Error(
        "このアカウントには管理者権限がありません。admin_usersを確認してください。"
      );
    }

    $("admin-email-display").textContent = adminUser.email || "";
    $("admin-login-form").reset();

    showScreen("admin-screen");
    await renderAdminSubjects();
  } catch (error) {
    console.error("ログインエラー:", error);
    showError("admin-login-error", errorMessage(error));
  } finally {
    button.disabled = false;
  }
}

async function adminLogout() {
  try {
    if (db) await db.auth.signOut();
  } catch (error) {
    console.error(error);
  }

  adminUser = null;
  adminSubject = null;
  adminProblem = null;
  showScreen("entry-screen");
}

// ========================================
// 6. 管理画面共通
// ========================================

function resetAdminContent(title, description = "") {
  const content = $("admin-content");
  content.replaceChildren();

  const heading = document.createElement("h2");
  heading.textContent = title;
  content.appendChild(heading);

  if (description) {
    const p = document.createElement("p");
    p.textContent = description;
    content.appendChild(p);
  }

  return content;
}

function adminActionButton(parent, label, action, className = "secondary") {
  parent.appendChild(
    makeButton(label, async () => {
      try {
        await requireAdmin();
        await action();
      } catch (error) {
        console.error(error);
        showError("admin-error", errorMessage(error));
      }
    }, className)
  );
}

function addNameForm(parent, title, initialValue, onSave) {
  const form = document.createElement("form");
  form.className = "admin-form";

  const heading = document.createElement("h3");
  heading.textContent = title;
  form.appendChild(heading);

  const input = addField(form, "名前", initialValue || "");
  const save = makeButton("保存", async () => {}, "primary");
  save.type = "submit";
  form.appendChild(save);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = input.value.trim();
    if (!name) {
      alert("名前を入力してください。");
      return;
    }

    save.disabled = true;

    try {
      await requireAdmin();
      await onSave(name);
    } catch (error) {
      console.error(error);
      showError("admin-error", errorMessage(error));
    } finally {
      save.disabled = false;
    }
  });

  parent.appendChild(form);
  input.focus();
}

function addRenameDelete(parent, table, row, refresh) {
  adminActionButton(parent, "名前を変更", async () => {
    const name = prompt("新しい名前を入力してください。", row.name);
    if (name === null || !name.trim()) return;

    const { error } = await db
      .from(table)
      .update({ name: name.trim() })
      .eq("id", row.id);

    if (error) throw error;
    await refresh();
  });

  adminActionButton(parent, "削除", async () => {
    if (!confirm(`「${row.name}」を削除しますか？関連データも削除される場合があります。`)) {
      return;
    }

    const { error } = await db.from(table).delete().eq("id", row.id);
    if (error) throw error;

    await refresh();
  });
}

// ========================================
// 7. 科目管理
// ========================================

async function renderAdminSubjects() {
  await requireAdmin();

  adminSubject = null;
  adminProblem = null;

  const content = resetAdminContent(
    "科目管理",
    "科目を追加・変更・削除できます。科目を選ぶと大問管理に進みます。"
  );

  addNameForm(content, "科目を追加", "", async (name) => {
    const { error } = await db.from("subjects").insert({ name });
    if (error) throw error;
    await renderAdminSubjects();
  });

  const { data, error } = await db
    .from("subjects")
    .select("id, name, sort_order")
    .order("sort_order")
    .order("id");

  if (error) throw error;

  data.forEach((subject) => {
    const row = makeAdminRow(subject.name);
    const actions = document.createElement("div");
    actions.className = "admin-actions";

    adminActionButton(actions, "大問を管理", async () => {
      adminSubject = subject;
      await renderAdminProblems();
    }, "primary");

    addRenameDelete(actions, "subjects", subject, renderAdminSubjects);

    row.appendChild(actions);
    content.appendChild(row);
  });
}

// ========================================
// 8. 大問管理
// ========================================

async function renderAdminProblems() {
  await requireAdmin();

  if (!adminSubject) {
    await renderAdminSubjects();
    return;
  }

  adminProblem = null;

  const content = resetAdminContent(
    `大問管理：${adminSubject.name}`,
    "大問を選ぶと小問管理に進みます。"
  );

  content.appendChild(
    makeButton("← 科目管理へ戻る", renderAdminSubjects)
  );

  addNameForm(content, "大問を追加", "", async (name) => {
    const { error } = await db.from("problems").insert({
      subject_id: adminSubject.id,
      name
    });

    if (error) throw error;
    await renderAdminProblems();
  });

  const { data, error } = await db
    .from("problems")
    .select("id, subject_id, name, sort_order")
    .eq("subject_id", adminSubject.id)
    .order("sort_order")
    .order("id");

  if (error) throw error;

  data.forEach((problem) => {
    const row = makeAdminRow(problem.name);
    const actions = document.createElement("div");
    actions.className = "admin-actions";

    adminActionButton(actions, "小問を管理", async () => {
      adminProblem = problem;
      await renderAdminQuestions();
    }, "primary");

    addRenameDelete(actions, "problems", problem, renderAdminProblems);

    row.appendChild(actions);
    content.appendChild(row);
  });
}

// ========================================
// 9. 小問管理・解答編集
// ========================================

async function renderAdminQuestions() {
  await requireAdmin();

  if (!adminSubject || !adminProblem) {
    await renderAdminProblems();
    return;
  }

  const content = resetAdminContent(
    `小問管理：${adminProblem.name}`,
    "小問を追加し、解答や画像を編集できます。"
  );

  content.appendChild(
    makeButton("← 大問管理へ戻る", renderAdminProblems)
  );

  addNameForm(content, "小問を追加", "", async (name) => {
    const { error } = await db.from("questions").insert({
      problem_id: adminProblem.id,
      name,
      answer: ""
    });

    if (error) throw error;
    await renderAdminQuestions();
  });

  const { data, error } = await db
    .from("questions")
    .select("id, problem_id, name, problem, answer, explanation, image_url, image_path, sort_order")
    .eq("problem_id", adminProblem.id)
    .order("sort_order")
    .order("id");

  if (error) throw error;

  data.forEach((question) => {
    const row = makeAdminRow(question.name);
    const actions = document.createElement("div");
    actions.className = "admin-actions";

    adminActionButton(actions, "解答を編集", async () => {
      await renderQuestionEditor(question);
    }, "primary");

    addRenameDelete(actions, "questions", question, renderAdminQuestions);

    row.appendChild(actions);
    content.appendChild(row);
  });
}

async function renderQuestionEditor(question) {
  await requireAdmin();

  const content = resetAdminContent(
    `解答編集：${question.name}`,
    "学習者画面では解答のみが表示されます。問題文・解説は管理用データとして保存します。"
  );

  content.appendChild(makeButton("← 小問一覧へ戻る", renderAdminQuestions));

  const form = document.createElement("form");
  form.className = "admin-form";

  const nameInput = addField(form, "小問名", question.name);
  const problemInput = addField(form, "問題文（管理用）", question.problem, true);
  const answerInput = addField(form, "解答", question.answer, true);
  const explanationInput = addField(form, "解説（管理用）", question.explanation, true);
  const imageInput = addFileField(form, "画像を追加・変更");

  const removeImageLabel = document.createElement("label");
  const removeImage = document.createElement("input");
  removeImage.type = "checkbox";
  removeImageLabel.append(removeImage, document.createTextNode("登録済み画像を削除する"));
  form.appendChild(removeImageLabel);

  if (question.image_url) {
    const imageInfo = document.createElement("p");
    imageInfo.textContent = "現在、画像が登録されています。";
    form.appendChild(imageInfo);
  }

  const saveButton = makeButton("変更を保存", async () => {}, "primary");
  saveButton.type = "submit";
  form.appendChild(saveButton);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    saveButton.disabled = true;

    try {
      await requireAdmin();

      const newName = nameInput.value.trim();
      if (!newName) throw new Error("小問名を入力してください。");

      let imageUrl = question.image_url || null;
      let imagePath = question.image_path || null;

      if (removeImage.checked && imagePath) {
        const { error: removeError } = await db.storage
          .from(BUCKET_NAME)
          .remove([imagePath]);

        if (removeError) throw removeError;

        imageUrl = null;
        imagePath = null;
      }

      const file = imageInput.files[0];

      if (file) {
        if (!file.type.startsWith("image/")) {
          throw new Error("画像ファイルを選択してください。");
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error("画像は5MB以下にしてください。");
        }

        const extension = file.name.split(".").pop().replace(/[^a-zA-Z0-9]/g, "");
        const path = `${adminProblem.id}/${question.id}-${Date.now()}.${extension || "png"}`;

        const { error: uploadError } = await db.storage
          .from(BUCKET_NAME)
          .upload(path, file, { upsert: true });

        if (uploadError) throw uploadError;

        if (imagePath && imagePath !== path) {
          await db.storage.from(BUCKET_NAME).remove([imagePath]);
        }

        const { data: publicData } = db.storage
          .from(BUCKET_NAME)
          .getPublicUrl(path);

        imageUrl = publicData.publicUrl;
        imagePath = path;
      }

      const { error: updateError } = await db
        .from("questions")
        .update({
          name: newName,
          problem: problemInput.value,
          answer: answerInput.value,
          explanation: explanationInput.value,
          image_url: imageUrl,
          image_path: imagePath,
          updated_at: new Date().toISOString()
        })
        .eq("id", question.id);

      if (updateError) throw updateError;

      alert("保存しました。");
      await renderAdminQuestions();
    } catch (error) {
      console.error("解答保存エラー:", error);
      showError("admin-error", errorMessage(error));
    } finally {
      saveButton.disabled = false;
    }
  });

  content.appendChild(form);
}

// ========================================
// 10. 訂正報告一覧
// ========================================

async function renderAdminRequests() {
  await requireAdmin();

  const content = resetAdminContent(
    "訂正報告一覧",
    "学習者から送られた報告を確認できます。"
  );

  const { data, error } = await db
    .from("requests")
    .select("id, subject_id, problem_id, question_id, message, status, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (!data.length) {
    content.appendChild(document.createTextNode("報告はありません。"));
    return;
  }

  const subjectIds = [...new Set(data.map((r) => r.subject_id).filter(Boolean))];
  const problemIds = [...new Set(data.map((r) => r.problem_id).filter(Boolean))];
  const questionIds = [...new Set(data.map((r) => r.question_id).filter(Boolean))];

  const [subjectsResult, problemsResult, questionsResult] = await Promise.all([
    subjectIds.length
      ? db.from("subjects").select("id, name").in("id", subjectIds)
      : Promise.resolve({ data: [], error: null }),
    problemIds.length
      ? db.from("problems").select("id, name").in("id", problemIds)
      : Promise.resolve({ data: [], error: null }),
    questionIds.length
      ? db.from("questions").select("id, name").in("id", questionIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (subjectsResult.error) throw subjectsResult.error;
  if (problemsResult.error) throw problemsResult.error;
  if (questionsResult.error) throw questionsResult.error;

  const subjectMap = new Map((subjectsResult.data || []).map((x) => [x.id, x.name]));
  const problemMap = new Map((problemsResult.data || []).map((x) => [x.id, x.name]));
  const questionMap = new Map((questionsResult.data || []).map((x) => [x.id, x.name]));

  data.forEach((request) => {
    const row = makeAdminRow(
      `${subjectMap.get(request.subject_id) || "科目不明"} / ` +
      `${problemMap.get(request.problem_id) || "大問不明"} / ` +
      `${questionMap.get(request.question_id) || "小問不明"}`
    );

    const date = document.createElement("p");
    date.textContent = new Date(request.created_at).toLocaleString("ja-JP");
    row.appendChild(date);

    const message = document.createElement("div");
    message.className = "request-message";
    message.textContent = request.message;
    row.appendChild(message);

    const status = document.createElement("p");
    status.className = "status";
    status.textContent = request.status;
    row.appendChild(status);

    const actions = document.createElement("div");
    actions.className = "admin-actions";

    adminActionButton(actions, "未確認にする", async () => {
      const { error } = await db
        .from("requests")
        .update({ status: "未確認" })
        .eq("id", request.id);

      if (error) throw error;
      await renderAdminRequests();
    });

    adminActionButton(actions, "確認済みにする", async () => {
      const { error } = await db
        .from("requests")
        .update({ status: "確認済み" })
        .eq("id", request.id);

      if (error) throw error;
      await renderAdminRequests();
    });

    adminActionButton(actions, "削除", async () => {
      if (!confirm("この報告を削除しますか？")) return;

      const { error } = await db
        .from("requests")
        .delete()
        .eq("id", request.id);

      if (error) throw error;
      await renderAdminRequests();
    });

    row.appendChild(actions);
    content.appendChild(row);
  });
}

// ========================================
// 11. イベント登録・起動
// ========================================

function setupEvents() {
  $("entry-form").addEventListener("submit", (event) => {
    event.preventDefault();
    enterSystem();
  });

  $("home-button").addEventListener("click", () => {
    showScreen("entry-screen");
  });

  $("problem-back").addEventListener("click", () => {
    showScreen("subject-screen");
  });

  $("question-back").addEventListener("click", () => {
    if (currentSubject) showProblems(currentSubject);
  });

  $("answer-back").addEventListener("click", () => {
    if (currentProblem) showQuestions(currentProblem);
  });

  $("request-button").addEventListener("click", openRequestScreen);

  $("request-cancel").addEventListener("click", () => {
    showScreen(returnScreenAfterRequest);
  });

  $("request-submit").addEventListener("click", submitRequest);

  $("admin-button").addEventListener("click", openAdmin);

  $("admin-login-form").addEventListener("submit", adminLogin);

  $("admin-login-back").addEventListener("click", () => {
    showScreen("entry-screen");
  });

  $("admin-logout-button").addEventListener("click", adminLogout);

  $("admin-subject-menu").addEventListener("click", async () => {
    try {
      await renderAdminSubjects();
    } catch (error) {
      showError("admin-error", errorMessage(error));
    }
  });

  $("admin-problem-menu").addEventListener("click", async () => {
    try {
      await renderAdminProblems();
    } catch (error) {
      showError("admin-error", errorMessage(error));
    }
  });

  $("admin-question-menu").addEventListener("click", async () => {
    try {
      await renderAdminQuestions();
    } catch (error) {
      showError("admin-error", errorMessage(error));
    }
  });

  $("admin-request-menu").addEventListener("click", async () => {
    try {
      await renderAdminRequests();
    } catch (error) {
      showError("admin-error", errorMessage(error));
    }
  });
}

function initializeSupabase() {
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabaseライブラリを読み込めませんでした。");
    showError(
      "entry-error",
      "Supabaseのライブラリを読み込めません。インターネット接続を確認してください。"
    );
    return;
  }

  if (
    !SUPABASE_URL.startsWith("https://") ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_ANON_KEY.includes("ここに")
  ) {
    showError(
      "entry-error",
      "app.jsのSUPABASE_ANON_KEYに公開用キーを設定してください。"
    );
    return;
  }

  try {
    db = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  } catch (error) {
    console.error("Supabase初期化エラー:", error);
    showError("entry-error", errorMessage(error));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupEvents();
  initializeSupabase();
});