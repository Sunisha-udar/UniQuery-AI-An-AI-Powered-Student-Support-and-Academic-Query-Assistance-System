import { Sparkles, Calendar, BookOpen, Trophy, Clock } from 'lucide-react'

export function WelcomeSection() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 max-w-4xl mx-auto">
      {/* Clean Icon */}
      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-8">
        <Sparkles className="w-8 h-8 text-white" />
      </div>

      {/* Simple Greeting */}
      <h1 className="text-3xl font-semibold text-text mb-3 text-center">
        Hello, Scholar
      </h1>

      {/* Description */}
      <p className="text-text-muted text-base max-w-xl text-center leading-relaxed mb-12">
        I'm your academic assistant. Ask me anything about your courses, schedule, or campus life.
      </p>

      {/* Clean Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 w-full mb-8">
        <div className="bg-surface border border-border rounded-xl p-4 hover:border-border-hover transition-colors">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="text-xs text-text-muted mb-1 uppercase tracking-wide font-medium">Next Class</div>
          <div className="text-2xl font-semibold text-text mb-0.5">2:30 PM</div>
          <div className="text-xs text-text-dim">Data Structures • CS201</div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 hover:border-border-hover transition-colors">
          <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5 text-secondary" />
          </div>
          <div className="text-xs text-text-muted mb-1 uppercase tracking-wide font-medium">Pending Tasks</div>
          <div className="text-2xl font-semibold text-text mb-0.5">3</div>
          <div className="text-xs text-text-dim">2 assignments, 1 quiz</div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 hover:border-border-hover transition-colors">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
            <Trophy className="w-5 h-5 text-accent" />
          </div>
          <div className="text-xs text-text-muted mb-1 uppercase tracking-wide font-medium">This Week</div>
          <div className="text-2xl font-semibold text-text mb-0.5">12</div>
          <div className="text-xs text-text-dim">Questions answered</div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 hover:border-border-hover transition-colors">
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xs text-text-muted mb-1 uppercase tracking-wide font-medium">Study Streak</div>
          <div className="text-2xl font-semibold text-text mb-0.5">7 days</div>
          <div className="text-xs text-text-dim">Keep it up!</div>
        </div>
      </div>

      {/* Simple Suggested Questions */}
      <div className="text-center">
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            'What\'s my schedule today?',
            'Upcoming deadlines',
            'Campus events this week'
          ].map((suggestion, idx) => (
            <button
              key={idx}
              className="px-4 py-2 rounded-lg border border-border bg-surface text-sm text-text-muted hover:bg-background hover:border-border-hover transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
