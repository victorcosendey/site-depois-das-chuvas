/* Depois das Chuvas — comportamento do site: idioma PT/EN, palavra do topo, chuva, entrada ao rolar, menu.
   Carregado por <script src="script.js" defer> no fim do index.html. */
(function () {
    var html = document.documentElement;
    var grupo = document.getElementById('idioma');
    var chave = grupo.querySelector('[role="switch"]');
    function definir(idioma) {
        html.setAttribute('data-lang', idioma);
        html.setAttribute('lang', idioma === 'en' ? 'en' : 'pt-br');
        var t = document.querySelector('title');
        if (t && t.getAttribute('data-' + idioma)) { document.title = t.getAttribute('data-' + idioma); }
        grupo.setAttribute('data-idioma', idioma);
        chave.setAttribute('aria-checked', idioma === 'en' ? 'true' : 'false');
        try { localStorage.setItem('idioma', idioma); } catch (e) {}
    }
    // Prioridade: link com ?lang=en  >  escolha salva do visitante  >  português
    var url = new URLSearchParams(window.location.search).get('lang');
    var salvo = null;
    try { salvo = localStorage.getItem('idioma'); } catch (e) {}
    definir((url === 'en' || url === 'pt') ? url : (salvo === 'en' ? 'en' : 'pt'));
    chave.addEventListener('click', function () { definir(html.getAttribute('data-lang') === 'pt' ? 'en' : 'pt'); });
    grupo.querySelectorAll('.idioma-lado').forEach(function (b) {
        b.addEventListener('click', function () { definir(b.getAttribute('data-lang')); });
    });

    // Palavra do topo: troca a cada ~2 s (sem animação se o visitante pediu menos movimento)
    var pal = document.getElementById('palavra');
    var atual = 0;
    function mostrarPalavra() {
        var lg = html.getAttribute('data-lang') === 'en' ? 'en' : 'pt';
        pal.querySelectorAll('.pw').forEach(function (w) {
            w.classList.toggle('on', w.getAttribute('lang') === lg && +w.getAttribute('data-i') === atual);
        });
    }
    mostrarPalavra();
    new MutationObserver(mostrarPalavra).observe(html, { attributes: true, attributeFilter: ['data-lang'] });
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setInterval(function () { atual = (atual + 1) % 4; mostrarPalavra(); }, 2000);
    }

    /* --- Chuva no topo: riscos finos caindo na diagonal; pausa fora da tela e respeita "reduzir movimento" --- */
    var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var tela = document.getElementById('chuva');
    var topo = document.getElementById('topo');
    if (tela && tela.getContext && !reduz) {
        var ctx = tela.getContext('2d');
        var gotas = [], L = 0, A = 0, dpr = 1, rodando = false, visivel = true, ultimo = 0;
        var INCLINA = 0.25; // desvio para a esquerda, igual ao das listras fixas
        function nova(y) {
            return { x: Math.random() * (L + A * INCLINA), y: y, c: 10 + Math.random() * 22, v: 340 + Math.random() * 420, a: 0.12 + Math.random() * 0.22 };
        }
        function medir() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            L = topo.clientWidth; A = topo.clientHeight;
            tela.width = L * dpr; tela.height = A * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            var n = Math.round(L * A / 9000);
            gotas = [];
            for (var i = 0; i < n; i++) { gotas.push(nova(Math.random() * A)); }
        }
        function quadro(t) {
            if (!rodando) { return; }
            var dt = Math.min((t - ultimo) / 1000, 0.05); ultimo = t;
            ctx.clearRect(0, 0, L, A);
            ctx.lineWidth = 1;
            for (var i = 0; i < gotas.length; i++) {
                var g = gotas[i];
                g.y += g.v * dt; g.x -= g.v * dt * INCLINA;
                if (g.y - g.c > A) { gotas[i] = g = nova(-g.c); }
                ctx.strokeStyle = 'rgba(235,230,218,' + g.a + ')';
                ctx.beginPath();
                ctx.moveTo(g.x, g.y);
                ctx.lineTo(g.x + g.c * INCLINA, g.y - g.c);
                ctx.stroke();
            }
            requestAnimationFrame(quadro);
        }
        function ligar() {
            var deveRodar = visivel && !document.hidden;
            if (deveRodar && !rodando) { rodando = true; ultimo = performance.now(); requestAnimationFrame(quadro); }
            if (!deveRodar) { rodando = false; }
        }
        medir();
        window.addEventListener('resize', medir);
        document.addEventListener('visibilitychange', ligar);
        new IntersectionObserver(function (e) { visivel = e[0].isIntersecting; ligar(); }).observe(topo);
        ligar();
    }

    /* --- Entrada suave das seções ao rolar, e menu marcando a seção atual --- */
    if (html.classList.contains('js')) {
        var alvos = document.querySelectorAll('main h2, main .col, .linhas li, .relato, .coord, .funcao-lista, .equipe, .objetivos li');
        if (reduz) {
            alvos.forEach(function (el) { el.classList.add('vis'); });
        } else {
            var io = new IntersectionObserver(function (itens) {
                itens.forEach(function (it) {
                    if (it.isIntersecting) { it.target.classList.add('vis'); io.unobserve(it.target); }
                });
            }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
            alvos.forEach(function (el, i) {
                el.classList.add('reveal');
                if (el.matches('.linhas li, .relato, .objetivos li')) {
                    var irmaos = Array.prototype.indexOf.call(el.parentNode.children, el);
                    el.style.transitionDelay = (irmaos % 4) * 90 + 'ms';
                }
                io.observe(el);
            });
        }
        var links = {};
        document.querySelectorAll('.menu-links a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
        var atual2 = null;
        var ioMenu = new IntersectionObserver(function (itens) {
            itens.forEach(function (it) {
                if (it.isIntersecting && links[it.target.id]) {
                    if (atual2) { atual2.classList.remove('ativo'); }
                    atual2 = links[it.target.id]; atual2.classList.add('ativo');
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        document.querySelectorAll('main section[id]').forEach(function (s) { ioMenu.observe(s); });
    }
})();