(function () {
  var searchInput = document.getElementById('blog-search');
  var tagContainer = document.getElementById('blog-tags');
  var grid = document.getElementById('blog-grid');
  var emptyEl = document.getElementById('blog-empty');
  var countEl = document.getElementById('blog-count');
  var cards = grid ? Array.from(grid.querySelectorAll('.blog-card')) : [];
  var chips = tagContainer ? Array.from(tagContainer.querySelectorAll('.chip')) : [];

  var searchIndex = [];
  var activeTag = 'all';
  var searchQuery = '';

  // Load search index for full-text body search
  fetch('/blog/search-index.json')
    .then(function (r) { return r.json(); })
    .then(function (data) { searchIndex = data; })
    .catch(function () {});

  function filterCards() {
    var visibleCount = 0;
    var q = searchQuery.toLowerCase().trim();

    cards.forEach(function (card) {
      var cardTags = (card.dataset.tags || '').split(',');
      var title = card.dataset.title || '';
      var excerpt = card.dataset.excerpt || '';

      // Tag filter
      var tagMatch = activeTag === 'all' || cardTags.indexOf(activeTag) !== -1;

      // Search filter
      var searchMatch = true;
      if (q) {
        searchMatch = title.indexOf(q) !== -1
          || excerpt.indexOf(q) !== -1
          || cardTags.some(function (t) { return t.toLowerCase().indexOf(q) !== -1; });

        // Full body search from index
        if (!searchMatch && searchIndex.length) {
          var href = card.querySelector('.blog-card-link');
          var slug = href ? href.getAttribute('href').split('/').pop() : '';
          var entry = searchIndex.find(function (e) { return e.slug === slug; });
          if (entry && entry.body && entry.body.indexOf(q) !== -1) {
            searchMatch = true;
          }
        }
      }

      var visible = tagMatch && searchMatch;
      card.classList.toggle('hidden', !visible);
      if (visible) visibleCount++;
    });

    if (countEl) {
      countEl.innerHTML = '<b>' + visibleCount + '</b> post' + (visibleCount !== 1 ? 's' : '');
    }

    if (emptyEl) {
      emptyEl.classList.toggle('show', visibleCount === 0);
    }
  }

  // Tag chip clicks
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      activeTag = chip.dataset.tag;
      chips.forEach(function (c) { c.classList.toggle('on', c.dataset.tag === activeTag); });
      filterCards();
      if (activeTag === 'all') {
        history.replaceState(null, '', window.location.pathname);
      } else {
        history.replaceState(null, '', '#' + encodeURIComponent(activeTag));
      }
    });
  });

  // Search input (debounced)
  var debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        searchQuery = searchInput.value;
        filterCards();
      }, 200);
    });
  }

  // Handle tag from URL hash on load
  var hash = decodeURIComponent(window.location.hash.slice(1));
  if (hash) {
    var matchChip = chips.find(function (c) { return c.dataset.tag === hash; });
    if (matchChip) {
      activeTag = hash;
      chips.forEach(function (c) { c.classList.toggle('on', c.dataset.tag === activeTag); });
      filterCards();
    }
  }
})();
