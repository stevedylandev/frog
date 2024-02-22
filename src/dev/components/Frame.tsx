import { externalLinkIcon, warpIcon } from './icons.js'

export function Frame() {
  return (
    <div
      class="w-full h-full"
      x-data="{
        get buttonCount() { return data.frame.buttons?.length ?? 0 },
        get hasIntents() { return Boolean(data.frame.input || data.frame.buttons.length) },
      }"
    >
      <div class="relative rounded-md relative w-full">
        <Img />

        <template x-if="hasIntents">
          <div class="bg-background-100 flex flex-col px-4 py-2 gap-2 rounded-bl-md rounded-br-md border-t-0 border">
            <template x-if="data.frame.input">
              <Input />
            </template>

            <template x-if="Boolean(data.frame.buttons.length)">
              <div
                class="grid gap-2.5"
                {...{
                  ':class': `{
                    'grid-cols-1': buttonCount === 1,
                    'grid-cols-2': buttonCount === 2,
                    'grid-cols-3': buttonCount === 3,
                    'grid-cols-4': buttonCount === 4,
                  }`,
                }}
              >
                <template x-for="button in data.frame.buttons">
                  <Button />
                </template>
              </div>
            </template>
          </div>
        </template>
      </div>

      <div class="text-xs mt-1 text-right">
        <a
          class="text-gray-700 font-medium"
          {...{ ':href': 'data.request.url' }}
          x-text="new URL(data.request.url).host"
        />
      </div>
    </div>
  )
}

function Img() {
  return (
    <img
      class="border object-cover w-full rounded-t-lg border-gray-200"
      style={{
        minHeight: '269px',
        maxHeight: '532.5px',
      }}
      {...{
        ':alt': `data.frame.title ?? 'Farcaster frame'`,
        ':class': `{
          'rounded-lg': !hasIntents,
        }`,
        ':src': 'data.frame.imageUrl',
        ':style': `{
          aspectRatio: data.frame.imageAspectRatio.replace(':', '/'),
        }`,
      }}
    />
  )
}

function Input() {
  return (
    <input
      autocomplete="off"
      class="bg-background-200 rounded-md border px-3 py-2.5 text-sm leading-snug w-full"
      name="inputText"
      type="text"
      x-model="inputText"
      {...{
        ':aria-label': 'data.frame.input.text',
        ':placeholder': 'data.frame.input.text',
      }}
    />
  )
}

function Button() {
  const buttonClass =
    'bg-gray-100 border-gray-200 flex items-center justify-center flex-row text-sm rounded-lg border cursor-pointer gap-1.5 h-10 py-2 px-4 w-full'
  const innerHtml = (
    <span
      class="whitespace-nowrap overflow-hidden text-ellipsis text-gray-1000 font-medium"
      x-text="title"
    />
  )
  const leavingAppPrompt = (
    <div
      x-show="open"
      class="flex flex-col gap-1.5 border bg-background-100 p-4 rounded-lg text-center"
      style={{
        position: 'absolute',
        marginTop: '4px',
        width: '20rem',
        zIndex: '10',
      }}
      {...{
        '@click.outside': 'open = false',
        '@keyup.escape': 'open = false',
        'x-trap': 'open',
      }}
    >
      <h1 class="font-semibold text-base text-gray-1000">Leaving Warpcast</h1>
      <div class="line-clamp-2 text-gray-700 text-sm font-mono" x-text="url" />
      <p class="text-sm leading-snug text-gray-900">
        If you connect your wallet and the site is malicious, you may lose
        funds.
      </p>
      <div class="flex gap-1.5 mt-1.5">
        <button
          class="bg-background-100 border rounded-md w-full text-sm font-medium py-2"
          type="button"
          x-on:click="open = false"
        >
          Cancel
        </button>
        <button
          class="bg-red-400 rounded-md w-full text-sm text-bg font-medium py-2"
          target="_blank"
          type="button"
          x-on:click={`open = false; window.open(url, '_blank');`}
        >
          Continue
        </button>
      </div>
    </div>
  )

  return (
    <div
      class="relative"
      x-data={`{
        open: false,
        get index() { return button.index },
        get target() { return button.target },
        get title() { return button.title },
        get type() { return button.type },
        url: button.type === 'link' && button.target ? button.target : undefined,
      }`}
    >
      <template x-if="type === 'link'">
        <div>
          <button class={buttonClass} type="button" x-on:click="open = true">
            {innerHtml}
            <div class="text-gray-900" style={{ marginTop: '2px' }}>
              {externalLinkIcon}
            </div>
          </button>

          {leavingAppPrompt}
        </div>
      </template>

      <template x-if="type === 'post_redirect'">
        <div>
          <button
            class={buttonClass}
            type="button"
            x-on:click={`
              if (open) return
              const body = {
                buttonIndex: index,
                inputText,
                postUrl: target ?? data.frame.postUrl,
                state: data.frame.state,
              }
              postFrameRedirect(body)
                .then((json) => {
                  // TODO: show error
                  if (json.response.status !== 302) return
                  url = json.response.location
                  open = true
                })
                .catch(console.error)
          `}
          >
            {innerHtml}
            <div class="text-gray-900" style={{ marginTop: '2px' }}>
              {externalLinkIcon}
            </div>
          </button>

          {leavingAppPrompt}
        </div>
      </template>

      <template x-if="type === 'mint'">
        <button class={buttonClass} type="button">
          <div>{warpIcon}</div>
          {innerHtml}
        </button>
      </template>

      <template x-if="type === 'post'">
        <button
          class={buttonClass}
          type="button"
          x-on:click={`
            const body = {
              buttonIndex: index,
              inputText,
              postUrl: target ?? data.frame.postUrl,
              state: data.frame.state,
            }
            postFrameAction(body)
              .then((json) => {
                const nextId = id + 1
                const item = { body, url: json.state.context.url }
                if (nextId < history.length) history = [...history.slice(0, nextId), item]
                else history = [...history, item]
                data = json
                id = nextId
                inputText = ''
              })
              .catch(console.error)
          `}
        >
          {innerHtml}
        </button>
      </template>
    </div>
  )
}