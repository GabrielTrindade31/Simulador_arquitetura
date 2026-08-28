# CPU Lab — Simulador de Arquitetura

Simulador didático, construído em HTML, CSS e JavaScript puro, para experimentar máquinas de zero, um, dois e três endereços. É possível configurar até 32 registradores e 64 posições de memória, renomear endereços, editar todos os valores e exportar o código e o relatório de execução em PDF.

## Executar localmente

Abra `index.html` no navegador ou inicie um servidor local:

```bash
python3 -m http.server 8000
```

Depois, acesse <http://localhost:8000> no navegador.

## Testar no GitHub Codespaces

1. Abra o repositório no GitHub.
2. Clique em **Code** → **Codespaces** → **Create codespace on main**.
3. Quando o terminal do Codespace estiver pronto, execute:

   ```bash
   python3 -m http.server 8000
   ```

4. O Codespaces detectará a porta `8000`. Clique em **Open in Browser** na notificação que aparecer no canto inferior direito.

Se a notificação não aparecer, abra a aba **Ports** ao lado do terminal, localize a porta `8000` e clique no ícone de globo (**Open in Browser**). Mantenha o comando em execução enquanto usa o simulador.

Para encerrar o servidor, volte ao terminal e pressione <kbd>Ctrl</kbd> + <kbd>C</kbd>.

### Se o Codespace mostrar a versão antiga

Atualize a `main`, encerre o servidor anterior e abra uma URL sem cache:

```bash
git switch main
git pull --ff-only origin main
pkill -f "python3 -m http.server" || true
python3 -m http.server 8000
```

Na aba **Ports**, abra novamente a porta `8000` e acrescente `?v=3` ao final da URL. A versão atual exibe o selo vermelho **NOVO** e o identificador **V3** no cabeçalho.
