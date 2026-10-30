const ADMIN_ID = "admin123";
const ADMIN_PASSWORD = "lib@123";

const sampleBooks = [
    { id: 1, title: "The Alchemist", author: "Paulo Coelho", quantity: 5, available: 5 },
    { id: 2, title: "Wings of Fire", author: "A. P. J. Abdul Kalam", quantity: 4, available: 4 },
    { id: 3, title: "Atomic Habits", author: "James Clear", quantity: 6, available: 6 },
    { id: 4, title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", quantity: 4, available: 4 },
    { id: 5, title: "Harry Potter", author: "J. K. Rowling", quantity: 5, available: 5 },
    { id: 6, title: "The Psychology of Money", author: "Morgan Housel", quantity: 3, available: 3 },
    { id: 7, title: "Ikigai", author: "Hector Garcia", quantity: 4, available: 4 },
    { id: 8, title: "Clean Code", author: "Robert C. Martin", quantity: 4, available: 4 },
    { id: 9, title: "Head First Java", author: "Kathy Sierra", quantity: 5, available: 5 },
    { id: 10, title: "Introduction to Algorithms", author: "Thomas H. Cormen", quantity: 3, available: 3 }
];

function loadData(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch {
        return fallback;
    }
}

let books = loadData("libraryBooks", sampleBooks);
let members = loadData("libraryMembers", []);
let issues = loadData("libraryIssues", []);

function saveData() {
    localStorage.setItem("libraryBooks", JSON.stringify(books));
    localStorage.setItem("libraryMembers", JSON.stringify(members));
    localStorage.setItem("libraryIssues", JSON.stringify(issues));
}

function nextId(items) {
    return items.length
        ? Math.max(...items.map(item => item.id)) + 1
        : 1;
}

function today() {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000)
        .toISOString().slice(0, 10);
}

// Login
const loginPage = document.getElementById("loginPage");
const dashboardPage = document.getElementById("dashboardPage");

document.getElementById("loginForm").addEventListener("submit", event => {
    event.preventDefault();

    const id = document.getElementById("loginId").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (id === ADMIN_ID && password === ADMIN_PASSWORD) {
        loginPage.hidden = true;
        dashboardPage.hidden = false;
        renderAll();
    } else {
        document.getElementById("loginMessage").textContent =
            "Invalid Login ID or Password!";
    }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    dashboardPage.hidden = true;
    loginPage.hidden = false;
    document.getElementById("loginForm").reset();
});

// Set default issue date and due date
const issueDateInput = document.getElementById("issueDate");
const dueDateInput = document.getElementById("dueDate");

issueDateInput.value = today();
issueDateInput.min = today();
dueDateInput.value = today();
dueDateInput.min = today();

issueDateInput.addEventListener("change", () => {
    dueDateInput.min = issueDateInput.value;
    if (dueDateInput.value < issueDateInput.value) {
        dueDateInput.value = issueDateInput.value;
    }
});

// Register member
document.getElementById("memberForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("memberName").value.trim();
    const email = document.getElementById("memberEmail").value.trim();

    if (!name || !email) return;

    if (members.some(member =>
        member.email.toLowerCase() === email.toLowerCase()
    )) {
        alert("This email is already registered.");
        return;
    }

    members.push({
        id: nextId(members),
        name,
        email
    });

    saveData();
    event.target.reset();
    renderAll();
});

// Add book
document.getElementById("bookForm").addEventListener("submit", event => {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const author = document.getElementById("author").value.trim();
    const quantity = Number(document.getElementById("quantity").value);

    if (!title || !author ||
        !Number.isInteger(quantity) || quantity < 1) {
        alert("Enter valid book details.");
        return;
    }

    books.push({
        id: nextId(books),
        title,
        author,
        quantity,
        available: quantity
    });

    saveData();
    event.target.reset();
    renderAll();
});

// Issue book to a specific member
document.getElementById("issueForm").addEventListener("submit", event => {
    event.preventDefault();

    const memberId = Number(document.getElementById("issueMember").value);
    const bookId = Number(document.getElementById("issueBook").value);
    const issueDate = issueDateInput.value;
    const dueDate = dueDateInput.value;

    const member = members.find(item => item.id === memberId);
    const book = books.find(item => item.id === bookId);
    const message = document.getElementById("issueMessage");

    if (!member || !book) {
        message.textContent = "Please select a valid member and book.";
        return;
    }

    if (book.available < 1) {
        message.textContent = "This book is not available.";
        return;
    }

    if (!issueDate || !dueDate ||
        issueDate < today() || dueDate < issueDate) {
        message.textContent = "Please select valid issue and due dates.";
        return;
    }

    issues.push({
        id: nextId(issues),
        memberId,
        bookId,
        issueDate,
        dueDate,
        returnDate: null,
        status: "Issued"
    });

    book.available--;

    saveData();
    message.textContent =
    `${book.title} issued successfully to ${member.name}.`;

    event.target.reset();
    issueDateInput.value = today();
    issueDateInput.min = today();
    dueDateInput.value = today();
    dueDateInput.min = today();

    renderAll();
});

// Return a book
function returnBook(issueId) {
    const record = issues.find(item => item.id === issueId);

    if (!record || record.status !== "Issued") return;

    const book = books.find(item => item.id === record.bookId);

    if (!book) {
        alert("Book record not found.");
        return;
    }

    record.status = "Returned";
    record.returnDate = today();
    book.available = Math.min(book.quantity, book.available + 1);

    saveData();
    renderAll();
}

// Delete a book only when none of its copies are issued
function deleteBook(bookId) {
    const book = books.find(b => b.id === bookId);

    if (!book) {
        alert("Book not found.");
        return;
    }

    const activeIssues = issues.filter(
        issue => issue.bookId === bookId && issue.status === "Issued"
    );

    let message = `Delete "${book.title}"?`;

    if (activeIssues.length > 0) {
        message += `\n\n${activeIssues.length} copy/copies are still issued. Their issue records will be kept, but the book will be removed from inventory.`;
    }

    if (!confirm(message)) {
        return;
    }

    // Remove the book from inventory, even if copies are issued.
    books = books.filter(b => b.id !== bookId);

    saveData();
    renderAll();

    alert("Book deleted successfully.");
}

// Display book inventory
function renderBooks() {
    const keyword = document.getElementById("search").value
        .trim().toLowerCase();

    const list = document.getElementById("bookList");
    list.replaceChildren();

    books.filter(book =>
        book.title.toLowerCase().includes(keyword) ||
        book.author.toLowerCase().includes(keyword)
    ).forEach(book => {
        const row = document.createElement("tr");

        [
            book.id,
            book.title,
            book.author,
            book.quantity,
            book.available
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");
        const button = document.createElement("button");

        button.textContent = "Delete";
        button.className = "delete-btn";
        button.addEventListener("click", () => deleteBook(book.id));

        actionCell.appendChild(button);
        row.appendChild(actionCell);
        list.appendChild(row);
    });
}

// Update member and book dropdowns
function renderDropdowns() {
    const memberSelect = document.getElementById("issueMember");
    const bookSelect = document.getElementById("issueBook");

    const oldMember = memberSelect.value;
    const oldBook = bookSelect.value;

    memberSelect.replaceChildren(new Option("Choose a member", ""));
    bookSelect.replaceChildren(new Option("Choose an available book", ""));

    members.forEach(member => {
        const option = new Option(
            `${member.name} (Member #${member.id})`,
    member.id
        );
        memberSelect.add(option);
    });

    books.filter(book => book.available > 0).forEach(book => {
        const option = new Option(
    `${book.title} — ${book.available} available`,
    book.id
        );
        bookSelect.add(option);
    });

    if (members.some(item => String(item.id) === oldMember)) {
        memberSelect.value = oldMember;
    }

    if (books.some(item =>
        String(item.id) === oldBook && item.available > 0
    )) {
        bookSelect.value = oldBook;
    }
}

// Display registered members and their current loans
function renderMembers() {
    const list = document.getElementById("memberList");
    list.replaceChildren();

    members.forEach(member => {
        const activeCount = issues.filter(item =>
            item.memberId === member.id && item.status === "Issued"
        ).length;

        const row = document.createElement("tr");

        [
            member.id,
            member.name,
            member.email,
            activeCount
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        list.appendChild(row);
    });
}

// Display who borrowed each book, including returned books
function renderIssues() {
    const list = document.getElementById("issueList");
    list.replaceChildren();

    [...issues].reverse().forEach(record => {
        const member = members.find(item => item.id === record.memberId);
        const book = books.find(item => item.id === record.bookId);

        const row = document.createElement("tr");

        const values = [
            record.id,
           member ? member.name : `Member #${record.memberId}`,
            book ? book.title : `Book #${record.bookId}`,
            record.issueDate,
            record.dueDate,
            record.returnDate || "—"
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");

        if (record.status === "Issued") {
            const button = document.createElement("button");
            button.textContent = "Return";
            button.className = "return-btn";
            button.addEventListener("click", () => returnBook(record.id));
            actionCell.appendChild(button);
        } else {
            actionCell.textContent = "Returned";
        }

        row.appendChild(actionCell);
        list.appendChild(row);
    });
}

// Dashboard statistics
function renderDashboard() {
    document.getElementById("totalBooks").textContent =
        books.reduce((sum, book) => sum + book.quantity, 0);

    document.getElementById("availableBooks").textContent =
        books.reduce((sum, book) => sum + book.available, 0);

    document.getElementById("issuedBooks").textContent =
        issues.filter(item => item.status === "Issued").length;

    document.getElementById("totalMembers").textContent = members.length;
}

function renderAll() {
    renderDashboard();
    renderBooks();
    renderDropdowns();
    renderMembers();
    renderIssues();
}

document.getElementById("clearHistoryBtn").addEventListener("click", () => {
    if (issues.length === 0) {
        alert("History is already empty.");
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to clear all issue and return history?"
    );

    if (!confirmed) return;

    // Keep active loans so book availability stays correct.
    issues = issues.filter(issue => issue.status === "Issued");

    saveData();
    renderAll();

    alert("Returned-book history has been cleared.");
});


document.getElementById("search").addEventListener("input", renderBooks);

// Save sample books on first run only
saveData();
renderAll();