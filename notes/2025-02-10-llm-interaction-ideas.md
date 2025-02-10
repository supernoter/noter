# llm interaction ideas

have different mnemonics and prefixes for different tasks, e.g.

* pressing CTRL-g while some text is selected will automatically apply a
  "style", e.g. by default a "style" that aims for readabiltiy and conciseness,
but the user could change the "critique" template to e.g. add a tone-of-voice
guide
* the prefix `::` keep the prompt around
* the prefix `__` replaces the prompt with a generated text

Other modes, e.g. inspired by "vim registers" - have a predefined prompt for
different letters, e.g.

* `t:` - some kind of socratic tutor mode

Example:

> t: different approximations of the number e

Then the editor becomes a kind of question and answer pad, where the user can
enter an answer and then the somehow can trigger a review and a follow up question

> t: ...

Bullet mode: listing items of a certain category

> b: cloud types

Or:

> b: proof techniques

Summarization mode:

> s: https://arxiv.org/abs/2405.04434

Or summarize a complete note an put a TL;DR on top

> ;: note
