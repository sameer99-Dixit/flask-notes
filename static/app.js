const input = document.getElementById("text");
const list = document.getElementById("list");

async function load() {
  const res = await fetch("/api/notes");
  const notes = await res.json();
  list.innerHTML = "";
  for (const n of notes) {
    const li = document.createElement("li");
    li.textContent = n.text;
    list.appendChild(li);
  }
}

async function addNote() {
  if (!input.value.trim()) return;
  await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: input.value }),
  });
  input.value = "";
  load();
}

document.getElementById("add").addEventListener("click", addNote);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addNote();
});

load();
