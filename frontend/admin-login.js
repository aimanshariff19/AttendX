function setLoading(isLoading) {
  const btn = document.getElementById("loginBtn");
  const text = btn?.querySelector(".btn-text");
  const loader = btn?.querySelector(".btn-loader");

  if (!btn) return;

  btn.classList.toggle("loading", isLoading);

  if (text) text.innerText = isLoading ? "Logging in..." : "Login";

  if (loader) loader.style.display = isLoading ? "inline-block" : "none";
}

function setLoadingButton(button, loading, text = "") {
  const textEl = button.querySelector(".btn-text");

  const loader = button.querySelector(".btn-loader");

  if (loading) {
    button.classList.add("loading");

    if (textEl) textEl.innerText = text;

    if (loader) loader.style.display = "inline-block";
  } else {
    button.classList.remove("loading");

    if (loader) loader.style.display = "none";
  }
}

function goBackPortal(event) {
  const button = event.currentTarget;

  setLoadingButton(button, true, "Going back to portal...");

  setTimeout(() => {
    window.location.href = "/";
  }, 500);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  const error = document.getElementById("error");

  const eye = document.getElementById("eyeIcon");

  const password = document.getElementById("password");

  const username = document.getElementById("username");

  const rememberMe = document.getElementById("rememberMe");

  const savedId = localStorage.getItem("admin_id_saved");

  const shouldRemember = localStorage.getItem("admin_remember") === "true";

  if (savedId && shouldRemember) {
    username.value = savedId;
    rememberMe.checked = true;
  }

  if (eye && password) {
    eye.addEventListener("click", () => {
      password.type = password.type === "password" ? "text" : "password";

      eye.classList.toggle("fa-eye");

      eye.classList.toggle("fa-eye-slash");
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    error.innerText = "";

    const id = username.value.trim();

    const pass = password.value.trim();

    if (!id || !pass) {
      error.innerText = "Please fill all fields";

      return;
    }

    try {
      setLoading(true);

      const user = await login(id, pass, "admin");

      if (user) {
        if (rememberMe.checked) {
          localStorage.setItem("admin_id_saved", id);

          localStorage.setItem("admin_remember", "true");
        } else {
          localStorage.removeItem("admin_id_saved");

          localStorage.removeItem("admin_remember");
        }

        window.location.href = "admin-panel.html";
      }
    } catch (err) {
      error.innerText = err.message || "Invalid admin credentials";
    } finally {
      setLoading(false);
    }
  });
});
