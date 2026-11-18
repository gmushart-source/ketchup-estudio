(function () {
  // 1. Acordeón interactivo de Servicios (solo uno abierto a la vez)
  var serviceCards = [].slice.call(document.querySelectorAll('#svc .sv'));
  serviceCards.forEach(function (card) {
    var btn = card.querySelector('.sv-trigger');
    var body = card.querySelector('.sv-body');
    btn.addEventListener('click', function () {
      var isOpen = card.classList.contains('on');
      serviceCards.forEach(function (item) {
        item.classList.remove('on');
        item.querySelector('.sv-trigger').setAttribute('aria-expanded', 'false');
        item.querySelector('.sv-body').hidden = true;
      });
      if (!isOpen) {
        card.classList.add('on');
        btn.setAttribute('aria-expanded', 'true');
        body.hidden = false;
      }
    });
  });

  // 2. Tarjetas interactivas del Equipo
  var crewCards = [].slice.call(document.querySelectorAll('#crew .m'));
  function activateCrew(target) {
    crewCards.forEach(function (card) {
      var active = card === target;
      card.classList.toggle('on', active);
      card.setAttribute('aria-expanded', active ? 'true' : 'false');
    });
  }
  crewCards.forEach(function (card) {
    card.addEventListener('click', function () { activateCrew(card); });
    card.addEventListener('focus', function () { activateCrew(card); });
    if (window.matchMedia('(hover:hover)').matches) {
      card.addEventListener('mouseenter', function () { activateCrew(card); });
    }
  });

  // 3. Pestañas Misión y Visión
  var tabButtons = document.querySelectorAll('.tabs button');
  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabButtons.forEach(function (b) { b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
      document.querySelectorAll('.panel').forEach(function (panel) {
        panel.hidden = panel.id !== btn.dataset.p;
      });
    });
  });

  // 4. Despliegue del formulario «Hablemos»
  var drawer = document.getElementById('contactDrawer');
  var closeBtn = document.getElementById('closeDrawer');
  var serviceSelect = document.getElementById('servicio');
  var openTriggers = document.querySelectorAll('.open-contact');

  function openForm(prefillService) {
    drawer.hidden = false;
    if (prefillService && serviceSelect) {
      serviceSelect.value = prefillService;
    }
    drawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () {
      var firstInput = document.getElementById('empresa');
      if (firstInput) firstInput.focus({ preventScroll: true });
    }, 450);
  }

  openTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      openForm(trigger.dataset.prefill || '');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      drawer.hidden = true;
    });
  }

  // 5. Validación y envío real del formulario «Hablemos»
  var form = document.getElementById('hablemosForm');
  var statusBox = document.getElementById('formStatus');
  var submitBtn = document.getElementById('submitBtn');

  function validateField(input) {
    var wrapper = input.closest('.field');
    var errEl = wrapper ? wrapper.querySelector('.err-msg') : null;
    var val = input.value.trim();
    var msg = '';

    if (!val) {
      msg = 'Este campo es obligatorio.';
    } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      msg = 'Ingresa un correo electrónico válido.';
    } else if (input.id === 'rif' && !/^[JVGECPjvgecp]-?\d{6,9}-?\d?$/.test(val)) {
      msg = 'Formato de RIF inválido (ej. J-12345678-9).';
    }

    if (wrapper) wrapper.classList.toggle('invalid', Boolean(msg));
    if (errEl) errEl.textContent = msg;
    return !msg;
  }

  if (form) {
    var requiredInputs = [].slice.call(form.querySelectorAll('input[required]:not([type="radio"]), select[required], textarea[required]'));

    requiredInputs.forEach(function (inp) {
      inp.addEventListener('blur', function () { validateField(inp); });
      inp.addEventListener('input', function () {
        if (inp.closest('.field').classList.contains('invalid')) validateField(inp);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      statusBox.className = 'form-status';
      statusBox.textContent = '';

      var allValid = true;
      requiredInputs.forEach(function (inp) {
        if (!validateField(inp)) allValid = false;
      });

      var modalidadChecked = form.querySelector('input[name="modalidad"]:checked');
      var modalidadErr = document.getElementById('modalidadErr');
      if (!modalidadChecked) {
        modalidadErr.textContent = 'Selecciona una modalidad de reunión.';
        allValid = false;
      } else {
        modalidadErr.textContent = '';
      }

      if (!allValid) {
        statusBox.className = 'form-status warn';
        statusBox.textContent = 'Por favor completa correctamente todos los campos obligatorios marcados en rojo.';
        return;
      }

      // Verificar si el endpoint de Formspree ya fue configurado
      var actionUrl = form.getAttribute('action') || '';
      if (actionUrl.indexOf('TU_ID_DE_FORMSPREE') !== -1) {
        statusBox.className = 'form-status warn';
        statusBox.innerHTML = 'Validación correcta, pero <strong>aún falta conectar el correo receptor</strong>: crea tu formulario gratuito en <a href="https://formspree.io" target="_blank" rel="noopener">formspree.io</a> y pega tu ID en el atributo <code>action</code> del archivo <code>index.html</code> (ver paso 5 de la guía).';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando solicitud...';

      fetch(actionUrl, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (res) {
          if (res.ok) {
            statusBox.className = 'form-status ok';
            statusBox.textContent = '¡Solicitud enviada con éxito! El equipo de KetchUp! Estudio se pondrá en contacto contigo muy pronto.';
            form.reset();
          } else {
            throw new Error('Error en el servidor');
          }
        })
        .catch(function () {
          statusBox.className = 'form-status warn';
          statusBox.textContent = 'No se pudo completar el envío en este momento. Verifica tu conexión a internet o el ID configurado en Formspree.';
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar solicitud';
        });
    });
  }

  // 6. Animación de aparición y rotación del sello
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  var stamp = document.getElementById('stamp');
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking || !stamp) return;
    ticking = true;
    requestAnimationFrame(function () {
      stamp.style.transform = 'rotate(' + (window.scrollY * 0.22) + 'deg)';
      ticking = false;
    });
  }, { passive: true });

  // 7. Resaltado de sección activa en el menú
  var navLinks = [].slice.call(document.querySelectorAll('nav a'));
  var secObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        navLinks.forEach(function (link) {
          link.classList.toggle('on', link.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  ['nosotros', 'servicios', 'equipo', 'identidad'].forEach(function (id) {
    var sec = document.getElementById(id);
    if (sec) secObserver.observe(sec);
  });
})();