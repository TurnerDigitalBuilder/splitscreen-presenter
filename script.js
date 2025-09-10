const samplePresentation = {
  title: "Sample Presentation",
  slides: [
    {
      title: "Welcome Slide",
      content: "<p>This is a sample presentation. Load your JSON file to begin.</p><blockquote class='quote'>Example pull-quote using Turner Copper accent.</blockquote>",
      notes: ["This is a speaker note", "Another helpful reminder"],
      prompts: ["Sample prompt to copy"],
      attachments: [{ fileName: "sample.pdf", url: "sample.pdf" }]
    }
  ]
};

let presentation = null;
let currentSlideIndex = 0;

const el = {
  presentationTitle: document.getElementById('presentationTitle'),
  progressIndicator: document.getElementById('progressIndicator'),
  slideContent: document.getElementById('slideContent'),
  notesSection: document.getElementById('notesSection'),
  notesList: document.getElementById('notesList'),
  promptsContainer: document.getElementById('promptsContainer'),
  attachmentsContainer: document.getElementById('attachmentsContainer'),
  promptsGroup: document.getElementById('promptsGroup'),
  attachmentsGroup: document.getElementById('attachmentsGroup'),
  interactiveSection: document.getElementById('interactiveSection'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  notesToggle: document.getElementById('notesToggle'),
  jsonFile: document.getElementById('jsonFile'),
  toast: document.getElementById('toast')
};

function init() {
  setupEvents();
  try {
    const saved = localStorage.getItem('presentationData');
    if (saved) {
      presentation = JSON.parse(saved);
      loadPresentation();
    }
  } catch (e) {
    console.error('Error loading saved presentation:', e);
  }
}

function setupEvents() {
  el.prevBtn.addEventListener('click', previousSlide);
  el.nextBtn.addEventListener('click', nextSlide);
  el.notesToggle.addEventListener('click', toggleNotes);
  el.jsonFile.addEventListener('change', handleFileUpload);

  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowLeft':
        previousSlide();
        break;
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        nextSlide();
        break;
      case 'n':
      case 'N':
        toggleNotes();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
    }
  });
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      presentation = normalizePresentation(data);
      localStorage.setItem('presentationData', JSON.stringify(presentation));
      currentSlideIndex = 0;
      loadPresentation();
      showToast('Presentation loaded successfully!');
    } catch (err) {
      console.error(err);
      showToast('Error loading presentation file. Please check the JSON format.');
    }
  };
  reader.readAsText(file);
}

function normalizePresentation(data) {
  if (data.title && data.slides) return data;
  if (Array.isArray(data)) return { title: data[0]?.title || "Presentation", slides: data };
  return { title: data.title || "Presentation", slides: data.slides || [data] };
}

function loadPresentation() {
  if (!presentation || !presentation.slides?.length) {
    showToast('Invalid presentation format');
    return;
  }
  el.presentationTitle.textContent = presentation.title;
  el.prevBtn.disabled = false;
  el.nextBtn.disabled = false;
  renderSlide();
}

function renderSlide() {
  const slide = presentation.slides[currentSlideIndex];
  el.progressIndicator.textContent = `${currentSlideIndex + 1} / ${presentation.slides.length}`;

  let html = "";
  if (slide.title) {
    html += `<h1 class="slide-title">${slide.title}</h1>`;
  }
  html += `<div class="slide-body">${slide.content || ""}</div>`;
  el.slideContent.innerHTML = html;

  // Render speaker notes
  if (slide.notes?.length) {
    el.notesList.innerHTML = slide.notes.map(n => `<li>${n}</li>`).join("");
  } else {
    el.notesList.innerHTML = "<li>No speaker notes for this slide</li>";
  }

  // Render prompts
  if (slide.prompts?.length) {
    el.promptsContainer.innerHTML = slide.prompts.map((p, i) =>
      `<button class="chip" data-prompt="${encodeURIComponent(p)}" title="Click to copy">💬 Prompt ${i + 1}</button>`
    ).join("");
    el.promptsGroup.style.display = "flex";
    el.promptsContainer.querySelectorAll('.chip').forEach(ch => {
      ch.addEventListener('click', () => copyToClipboard(decodeURIComponent(ch.dataset.prompt)));
    });
  } else {
    el.promptsGroup.style.display = "none";
  }

  // Render attachments
  if (slide.attachments?.length) {
    el.attachmentsContainer.innerHTML = slide.attachments.map(a =>
      `<button class="chip" data-url="${a.url}" title="Click to open">📄 ${a.fileName}</button>`
    ).join("");
    el.attachmentsGroup.style.display = "flex";
    el.attachmentsContainer.querySelectorAll('.chip').forEach(ch => {
      ch.addEventListener('click', () => window.open(ch.dataset.url, "_blank"));
    });
  } else {
    el.attachmentsGroup.style.display = "none";
  }

  // Show/hide interactive section
  const hasInteractive = (slide.prompts?.length || 0) > 0 || (slide.attachments?.length || 0) > 0;
  el.interactiveSection.style.display = hasInteractive ? "flex" : "none";

  // Update navigation buttons
  el.prevBtn.disabled = currentSlideIndex === 0;
  el.nextBtn.disabled = currentSlideIndex === presentation.slides.length - 1;
}

function previousSlide() {
  if (currentSlideIndex > 0) {
    currentSlideIndex--;
    renderSlide();
  }
}

function nextSlide() {
  if (currentSlideIndex < presentation.slides.length - 1) {
    currentSlideIndex++;
    renderSlide();
  }
}

function toggleNotes() {
  el.notesSection.classList.toggle('active');
  el.notesToggle.classList.toggle('active');
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Prompt copied to clipboard!');
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast('Prompt copied to clipboard!');
  }
}

function showToast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add('show');
  setTimeout(() => el.toast.classList.remove('show'), 2600);
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
