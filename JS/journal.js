/* =========================================================
   MINDMIRROR JOURNAL
   Title + Thoughts + Memories
   Frontend Version
   ========================================================= */


/* ================= ELEMENTS ================= */
import { auth } from "../JS/firebase-config.js";
const journalTitle =
    document.getElementById("journalTitle");

const journalText =
    document.getElementById("journalText");

const characterCount =
    document.getElementById("characterCount");

const wordCount =
    document.getElementById("wordCount");

const readingTime =
    document.getElementById("readingTime");

const imageInput =
    document.getElementById("imageInput");

const memoryGrid =
    document.getElementById("memoryGrid");

const memoryCount =
    document.getElementById("memoryCount");

const journalMessage =
    document.getElementById("journalMessage");

const saveJournalBtn =
    document.getElementById("saveJournalBtn");

const clearBtn =
    document.getElementById("clearBtn");

const dashboardBtn =
    document.getElementById("dashboardBtn");

const currentDate =
    document.getElementById("currentDate");


/* ================= SETTINGS ================= */

const MAX_IMAGES = 6;

const MAX_IMAGE_SIZE =
    5 * 1024 * 1024;


/* ================= STATE ================= */

let selectedImages = [];

let imageIdCounter = 0;


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        displayCurrentDate();

        updateWritingStats();

        setupWritingArea();

        setupImageUpload();

        setupClearButton();

        setupDashboardButton();

        setupSaveButton();

    }
);


/* =========================================================
   DATE
   ========================================================= */

function displayCurrentDate() {

    const now = new Date();


    const formattedDate =
        now.toLocaleDateString(
            undefined,
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );


    currentDate.textContent =
        formattedDate;

}


/* =========================================================
   WRITING AREA
   ========================================================= */

function setupWritingArea() {

    journalTitle.addEventListener(
        "input",
        function () {

            clearMessage();

        }
    );


    journalText.addEventListener(
        "input",
        function () {

            updateWritingStats();

            clearMessage();

        }
    );

}


/* =========================================================
   WRITING STATISTICS
   ========================================================= */

function updateWritingStats() {

    const text =
        journalText.value.trim();


    const characters =
        journalText.value.length;


    let words = 0;


    if (text.length > 0) {

        words =
            text
                .split(/\s+/)
                .filter(Boolean)
                .length;

    }


    const minutes =
        words === 0
            ? 0
            : Math.max(
                1,
                Math.ceil(words / 200)
            );


    characterCount.textContent =
        `${characters} / 5000`;


    wordCount.textContent =
        `${words} ${
            words === 1
                ? "word"
                : "words"
        }`;


    readingTime.textContent =
        `About ${minutes} min read`;

}


/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

function setupImageUpload() {

    imageInput.addEventListener(
        "change",
        function (event) {

            const files =
                Array.from(
                    event.target.files
                );


            handleFiles(files);


            /*
                Allows the same image to be
                selected again later.
            */

            imageInput.value = "";

        }
    );

}


/* =========================================================
   HANDLE FILES
   ========================================================= */

function handleFiles(files) {

    if (!files.length) {
        return;
    }


    /*
        Maximum 6 images.
    */

    if (
        selectedImages.length >=
        MAX_IMAGES
    ) {

        showMessage(
            "You can add a maximum of 6 memories.",
            "error"
        );

        return;

    }


    const availableSlots =
        MAX_IMAGES -
        selectedImages.length;


    const filesToAdd =
        files.slice(
            0,
            availableSlots
        );


    if (
        files.length >
        availableSlots
    ) {

        showMessage(
            `Only ${availableSlots} more memory ${
                availableSlots === 1
                    ? "photo"
                    : "photos"
            } can be added.`,
            "error"
        );

    }


    filesToAdd.forEach(
        function (file) {

            /*
                Check image type.
            */

            if (
                ![
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ].includes(file.type)
            ) {

                showMessage(
                    "Please select JPG, PNG or WEBP images.",
                    "error"
                );

                return;

            }


            /*
                Check image size.
            */

            if (
                file.size >
                MAX_IMAGE_SIZE
            ) {

                showMessage(
                    `${file.name} is larger than 5 MB.`,
                    "error"
                );

                return;

            }


            imageIdCounter++;


            const imageData = {

                id: imageIdCounter,

                file: file,

                url:
                    URL.createObjectURL(file)

            };


            selectedImages.push(
                imageData
            );


            createImagePreview(
                imageData
            );

        }
    );


    updateMemoryCount();

}


/* =========================================================
   CREATE IMAGE PREVIEW
   ========================================================= */

function createImagePreview(imageData) {

    const item =
        document.createElement("div");


    item.className =
        "memory-item";


    item.dataset.imageId =
        imageData.id;


    const image =
        document.createElement("img");


    image.src =
        imageData.url;


    image.alt =
        "Journal memory";


    const removeButton =
        document.createElement("button");


    removeButton.type =
        "button";


    removeButton.className =
        "remove-memory-btn";


    removeButton.textContent =
        "×";


    removeButton.setAttribute(
        "aria-label",
        "Remove memory"
    );


    removeButton.addEventListener(
        "click",
        function () {

            removeImage(
                imageData.id
            );

        }
    );


    item.appendChild(image);

    item.appendChild(removeButton);

    memoryGrid.appendChild(item);

}


/* =========================================================
   REMOVE IMAGE
   ========================================================= */

function removeImage(imageId) {

    const index =
        selectedImages.findIndex(
            function (image) {

                return (
                    image.id ===
                    imageId
                );

            }
        );


    if (index === -1) {
        return;
    }


    URL.revokeObjectURL(
        selectedImages[index].url
    );


    selectedImages.splice(
        index,
        1
    );


    const imageElement =
        document.querySelector(
            `.memory-item[data-image-id="${imageId}"]`
        );


    if (imageElement) {

        imageElement.remove();

    }


    updateMemoryCount();

}


/* =========================================================
   MEMORY COUNT
   ========================================================= */

function updateMemoryCount() {

    memoryCount.textContent =
        `${selectedImages.length} / ${MAX_IMAGES}`;

}


/* =========================================================
   CLEAR BUTTON
   ========================================================= */

function setupClearButton() {

    clearBtn.addEventListener(
        "click",
        function () {

            const hasContent =
                journalTitle.value.trim() ||
                journalText.value.trim() ||
                selectedImages.length > 0;


            if (!hasContent) {

                showMessage(
                    "There is nothing to clear.",
                    "error"
                );

                return;

            }


            const confirmed =
                window.confirm(
                    "Clear this journal entry?"
                );


            if (!confirmed) {
                return;
            }


            clearJournal();

        }
    );

}


/* =========================================================
   CLEAR JOURNAL
   ========================================================= */

function clearJournal() {

    journalTitle.value =
        "";


    journalText.value =
        "";


    selectedImages.forEach(
        function (image) {

            URL.revokeObjectURL(
                image.url
            );

        }
    );


    selectedImages = [];


    memoryGrid.innerHTML =
        "";


    updateWritingStats();

    updateMemoryCount();

    clearMessage();

}


/* =========================================================
   SAVE JOURNAL
   ========================================================= */

function setupSaveButton() {

    saveJournalBtn.addEventListener(
        "click",
        saveJournal
    );

}


/* =========================================================
   SAVE JOURNAL
   ========================================================= */

async function saveJournal() {

    const title = journalTitle.value.trim();
    const thoughts = journalText.value.trim();

    if (!title && !thoughts && selectedImages.length === 0) {
        showMessage(
            "Add a title, write your thoughts, or add a memory before saving.",
            "error"
        );
        return;
    }

    // Backend requires journal thoughts
    if (!thoughts) {
        showMessage(
            "Please write your thoughts before saving.",
            "error"
        );
        return;
    }

    const user = auth.currentUser;

    if (!user) {
        showMessage(
            "Please log in before saving your journal.",
            "error"
        );
        return;
    }

    saveJournalBtn.disabled = true;
    saveJournalBtn.textContent = "Saving...";

    try {

        const token = await user.getIdToken();

        // Save journal entry
        const response = await fetch(
            "https://mindmirror-backend-b6zj.onrender.com/api/journal",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: title,
                    entry: thoughts
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to save journal."
            );
        }

        const journalId = result.journal_id;

        // Upload selected images
        for (const image of selectedImages) {

            const formData = new FormData();

            formData.append("image", image.file);

            const imageResponse = await fetch(
                `https://mindmirror-backend-b6zj.onrender.com/api/journal/${journalId}/images`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    body: formData
                }
            );

            const imageResult = await imageResponse.json();

            if (!imageResponse.ok) {
                throw new Error(
                    imageResult.message || "Journal saved, but an image failed to upload."
                );
            }
        }

        showMessage(
            "Your journal has been saved successfully!",
            "success"
        );

        console.log("Journal saved:", result);

    } catch (error) {

        console.error("Journal save error:", error);

        showMessage(
            error.message || "Unable to save journal.",
            "error"
        );

    } finally {

        saveJournalBtn.disabled = false;
        saveJournalBtn.textContent = "Save Journal";

    }

}



/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    message,
    type
) {

    journalMessage.textContent =
        message;


    journalMessage.className =
        `journal-message ${type}`;


    window.clearTimeout(
        showMessage.timeout
    );


    showMessage.timeout =
        window.setTimeout(
            function () {

                clearMessage();

            },
            4000
        );

}


/* =========================================================
   CLEAR MESSAGE
   ========================================================= */

function clearMessage() {

    journalMessage.textContent =
        "";


    journalMessage.className =
        "journal-message";

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function setupDashboardButton() {

    dashboardBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "dashboard.html";

        }
    );

}