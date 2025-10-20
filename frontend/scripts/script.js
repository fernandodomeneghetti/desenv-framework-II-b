const API_BASE = "http://localhost:3000";
let token = sessionStorage.getItem('token');

// Elementos de login
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const loginMsg = document.getElementById("login-msg");

// CRUD elementos
const crudSection = document.getElementById("crud-section");
const logoutBtn = document.getElementById("logout-btn");
const formAluno = document.getElementById("form-aluno");
const tabela = document.getElementById("tabela-alunos");
const inputId = document.getElementById("id");
const inputNome = document.getElementById("nome");
const inputRa = document.getElementById("ra");

// Verificar se já está logado
if (token) {
  loginForm.style.display = "none";
  crudSection.style.display = "block";
  carregarAlunos();
}

// ==== LOGIN ====
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const credenciais = {
    email: emailInput.value,
    senha: senhaInput.value
  };

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credenciais)
    });

    if (!res.ok) throw new Error("Falha no login");

    const data = await res.json();
    token = data.token;

    if (!token) throw new Error("Token não retornado!");

    sessionStorage.setItem('token', token);
    loginForm.style.display = "none";
    crudSection.style.display = "block";
    carregarAlunos();

  } catch (err) {
    loginMsg.textContent = "❌ E-mail ou senha inválidos.";
  }
});

// ==== LOGOUT ====
logoutBtn.addEventListener("click", () => {
  token = null;
  sessionStorage.removeItem('token');
  loginForm.reset();
  formAluno.reset();
  crudSection.style.display = "none";
  loginForm.style.display = "block";
});

// ==== CRUD ====
async function carregarAlunos() {
  try {
    const res = await fetch(`${API_BASE}/aluno`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        token = null;
        sessionStorage.removeItem('token');
        crudSection.style.display = "none";
        loginForm.style.display = "block";
        return;
      }
      throw new Error("Erro ao carregar alunos");
    }

    const alunos = await res.json();

    tabela.innerHTML = alunos.map(a => `
      <tr>
        <td>${a.id}</td>
        <td>${a.nome}</td>
        <td>${a.ra}</td>
        <td>
          <span class="edit-btn" onclick="editarAluno(${a.id}, '${a.nome}', '${a.ra}')">Editar</span> |
          <span class="delete-btn" onclick="excluirAluno(${a.id})">Excluir</span>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Erro ao carregar alunos:", err);
  }
}

formAluno.addEventListener("submit", async (e) => {
  e.preventDefault();

  const aluno = { nome: inputNome.value, ra: inputRa.value };
  const id = inputId.value;

  const method = id ? "PUT" : "POST";
  const url = id ? `${API_BASE}/aluno/${id}` : `${API_BASE}/aluno`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(aluno)
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        token = null;
        sessionStorage.removeItem('token');
        crudSection.style.display = "none";
        loginForm.style.display = "block";
        return;
      }
      throw new Error("Erro ao salvar aluno");
    }

    formAluno.reset();
    carregarAlunos();

  } catch (err) {
    alert("Erro: " + err.message);
  }
});

async function excluirAluno(id) {
  if (!confirm("Deseja excluir este aluno?")) return;

  try {
    const res = await fetch(`${API_BASE}/aluno/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        token = null;
        sessionStorage.removeItem('token');
        crudSection.style.display = "none";
        loginForm.style.display = "block";
        return;
      }
      throw new Error("Erro ao excluir aluno");
    }
    carregarAlunos();

  } catch (err) {
    alert("Erro: " + err.message);
  }
}

function editarAluno(id, nome, ra) {
  inputId.value = id;
  inputNome.value = nome;
  inputRa.value = ra;
}