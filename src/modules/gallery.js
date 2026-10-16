/**
 * Màn 3: Gallery Chân Dung Các Chị Em
 */
export function initGallery(peopleList) {
  const container = document.getElementById('galleryContainer');
  if (!container) return { highlightPerson: () => {} };

  container.innerHTML = '';

  peopleList.forEach(person => {
    const card = document.createElement('div');
    card.className = 'portrait-card';
    card.id = `portrait-${person.id}`;

    // Kiểm tra quyền hiển thị ảnh (has_consent)
    const hasPhoto = Boolean(person.has_consent && person.photo);
    const initials = person.name.split(' ').map(n => n[0]).slice(-2).join('');

    card.innerHTML = `
      <div class="portrait-image-wrapper">
        ${
          hasPhoto
            ? `<img src="${person.photo}" alt="${person.name}" loading="lazy">`
            : `<div class="portrait-initials" title="${person.name}">${initials}</div>`
        }
      </div>
      <div class="portrait-info">
        <h3 class="portrait-name">${person.name}</h3>
        <p class="portrait-role">${person.role || 'Thành viên xuất sắc'}</p>
        <p class="portrait-dept">${person.dept || 'Tech & Product'}</p>
      </div>
    `;

    container.appendChild(card);
  });

  function highlightPerson(personId) {
    document.querySelectorAll('.portrait-card').forEach(el => el.classList.remove('highlighted'));
    const target = document.getElementById(`portrait-${personId}`);
    if (target) {
      target.classList.add('highlighted');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return { highlightPerson };
}
