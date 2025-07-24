import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import * as React from 'react'

export function StatCard({
  icon: Icon,
  title,
  value,
  badge,
  trend,
  description,
  trendIcon: TrendIcon,
  badgeValue,
  action,
  trendColor,
}: {
  icon: React.ElementType
  title: string
  value: string | number
  badge?: string
  badgeValue?: string
  trend?: string
  description?: string
  trendIcon?: React.ElementType
  action?: React.ReactNode
  trendColor?: string
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          {action}
          {badge && (
            <Badge variant="outline" className={trendColor || "text-muted-foreground"}>
              {TrendIcon && <TrendIcon className={"mr-1 h-4 w-4 " + (trendColor || "text-muted-foreground")} />}
              {badge}
              {badgeValue && <span className="ml-1">{badgeValue}</span>}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        {trend && (
          <div className={"line-clamp-1 flex gap-2 font-medium " + (trendColor || "text-muted-foreground") }>
            {trend} {TrendIcon && <TrendIcon className={"size-4 " + (trendColor || "text-muted-foreground")} />}
          </div>
        )}
        {description && (
          <div className="text-muted-foreground">{description}</div>
        )}
      </CardFooter>
    </Card>
  )
} 